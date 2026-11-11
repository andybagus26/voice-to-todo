import {
  MAKS_DURASI_MS,
  MAKS_UKURAN_AUDIO,
  SkemaHasilProses,
  TIPE_AUDIO_DITERIMA,
  TOLERANSI_DURASI_MS,
} from "@/lib/hasil";
import { alamatKlien, buatPembatas, type Pembatas } from "./rate-limit";
import { GalatRingkasan, pilihPeringkas, type Peringkas } from "./summarize";
import {
  GalatBatasPenyedia,
  GalatKonfigurasi,
  pilihTranskriptor,
  type Transkriptor,
} from "./transcribe";

/** Kode galat yang dikirim ke browser. Tidak pernah memuat isi transkrip. */
export type KodeGalatServer =
  | "terlalu-sering"
  | "permintaan-tidak-valid"
  | "tipe-tidak-didukung"
  | "terlalu-besar"
  | "terlalu-panjang"
  | "tidak-terdengar"
  | "ringkasan-gagal"
  | "belum-dikonfigurasi"
  | "galat-server";

const pembatasBawaan = buatPembatas(
  Number(process.env.RATE_LIMIT_MAX ?? 10),
  Number(process.env.RATE_LIMIT_WINDOW_MS ?? 10 * 60 * 1000),
);

type Pencatat = (kode: KodeGalatServer, rincian: Record<string, unknown>) => void;

type Ketergantungan = {
  pembatas?: Pembatas;
  transkriptor?: Transkriptor;
  peringkas?: Peringkas;
  catat?: Pencatat;
};

const galat = (kode: KodeGalatServer, status: number, header?: HeadersInit) =>
  Response.json({ galat: kode }, { status, headers: header });

/** Log hanya memuat kode dan angka, tidak pernah isi transkrip atau audio. */
const catatBawaan: Pencatat = (kode, rincian) => {
  console.error("[api/process]", kode, JSON.stringify(rincian));
};

/**
 * POST /api/process: transkripsi lalu ringkasan.
 * Menerima multipart: audio (berkas), direkamPada (epoch ms), durasiMs.
 * Tidak ada yang disimpan di server; hasil hanya dikembalikan ke browser.
 */
export async function prosesPermintaan(
  permintaan: Request,
  ketergantungan: Ketergantungan = {},
): Promise<Response> {
  const pembatas = ketergantungan.pembatas ?? pembatasBawaan;
  const catat = ketergantungan.catat ?? catatBawaan;

  const kuota = pembatas.cek(alamatKlien(permintaan));
  if (!kuota.diizinkan) {
    return galat("terlalu-sering", 429, { "Retry-After": String(kuota.cobaLagiDetik) });
  }

  // Tolak badan yang jelas terlalu besar sebelum dibaca.
  const panjang = Number(permintaan.headers.get("content-length") ?? 0);
  if (panjang > MAKS_UKURAN_AUDIO + 64 * 1024) return galat("terlalu-besar", 413);

  let formulir: FormData;
  try {
    formulir = await permintaan.formData();
  } catch {
    return galat("permintaan-tidak-valid", 400);
  }

  const audio = formulir.get("audio");
  const direkamPada = Number(formulir.get("direkamPada"));
  const durasiMs = Number(formulir.get("durasiMs"));
  if (!(audio instanceof Blob) || audio.size === 0) {
    return galat("permintaan-tidak-valid", 400);
  }
  if (audio.size > MAKS_UKURAN_AUDIO) return galat("terlalu-besar", 413);

  const mimeType = audio.type.split(";")[0].trim().toLowerCase();
  if (!(TIPE_AUDIO_DITERIMA as readonly string[]).includes(mimeType)) {
    return galat("tipe-tidak-didukung", 415);
  }

  const sekarang = Date.now();
  if (
    !Number.isFinite(direkamPada) ||
    direkamPada <= 0 ||
    direkamPada > sekarang + 24 * 60 * 60 * 1000 ||
    !Number.isFinite(durasiMs) ||
    durasiMs <= 0
  ) {
    return galat("permintaan-tidak-valid", 400);
  }
  if (durasiMs > MAKS_DURASI_MS + TOLERANSI_DURASI_MS) return galat("terlalu-panjang", 422);

  const mulai = sekarang;
  try {
    const transkriptor = ketergantungan.transkriptor ?? pilihTranskriptor();
    const peringkas = ketergantungan.peringkas ?? pilihPeringkas();

    const transkripsi = await transkriptor({ audio, mimeType, durasiMs });
    // Durasi dari penyedia lebih dipercaya daripada angka dari browser.
    if ((transkripsi.durasiMs ?? 0) > MAKS_DURASI_MS + TOLERANSI_DURASI_MS) {
      return galat("terlalu-panjang", 422);
    }
    const transkrip = transkripsi.teks.trim();
    if (!transkrip) return galat("tidak-terdengar", 422);

    const ringkasan = await peringkas({ transkrip, direkamPada });
    const hasil = SkemaHasilProses.parse({ ...ringkasan, transkrip });
    return Response.json(hasil, { headers: { "Cache-Control": "no-store" } });
  } catch (sebab) {
    const rincian = {
      jenis: sebab instanceof Error ? sebab.name : typeof sebab,
      ukuran: audio.size,
      durasiMs,
      lamaMs: Date.now() - mulai,
    };
    if (sebab instanceof GalatKonfigurasi) {
      catat("belum-dikonfigurasi", { ...rincian, pesan: sebab.message });
      return galat("belum-dikonfigurasi", 503);
    }
    if (sebab instanceof GalatBatasPenyedia) {
      catat("terlalu-sering", { ...rincian, sumber: "penyedia" });
      return galat("terlalu-sering", 429, { "Retry-After": "60" });
    }
    if (sebab instanceof GalatRingkasan) {
      catat("ringkasan-gagal", rincian);
      return galat("ringkasan-gagal", 502);
    }
    catat("galat-server", rincian);
    return galat("galat-server", 502);
  }
}
