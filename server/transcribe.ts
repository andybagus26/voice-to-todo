/**
 * Transkripsi audio ke teks. Claude API tidak menerima input audio, jadi
 * transkripsi memakai penyedia terpisah yang dipilih lewat TRANSCRIBE_PROVIDER.
 *
 * Isi transkrip tidak pernah dicatat ke log dan tidak disimpan di server.
 */
export type HasilTranskripsi = {
  teks: string;
  /** Durasi audio menurut penyedia, bila ada. Dipakai untuk batas 10 menit di server. */
  durasiMs?: number;
};

export type MasukanTranskripsi = {
  audio: Blob;
  mimeType: string;
  /** Durasi menurut browser; tidak dipercaya begitu saja bila penyedia melaporkan durasinya. */
  durasiMs: number;
};

export type Transkriptor = (masukan: MasukanTranskripsi) => Promise<HasilTranskripsi>;

export class GalatKonfigurasi extends Error {}

/** Penyedia AI menolak karena batas pemakaian (HTTP 429), mis. kuota tier gratis habis. */
export class GalatBatasPenyedia extends Error {}

const TRANSKRIP_TIRUAN =
  "Oke, kita mulai rapatnya. Dana acara masih kurang, jadi kita perlu sponsor tambahan. " +
  "Proposal sponsor harus sudah dikirim ke ketua panitia sebelum Jumat. " +
  "Terus soal vendor, tolong besok dicek harga sewa sound system, " +
  "dan survei harga vendor kita mulai minggu ini.";

/**
 * Penyedia tiruan untuk pengembangan: mengabaikan audio dan mengembalikan
 * transkrip contoh. Durasinya diambil dari browser.
 */
const tiruan: Transkriptor = async ({ durasiMs }) => {
  const jeda = Number(process.env.MOCK_AI_DELAY_MS ?? 800);
  if (jeda > 0) await new Promise((selesai) => setTimeout(selesai, jeda));
  return { teks: TRANSKRIP_TIRUAN, durasiMs };
};

/** Penyedia tiruan hanya boleh di luar produksi, kecuali diizinkan terang-terangan. */
export function tiruanDiizinkan(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_AI === "1";
}

/** Penyedia dengan API transkripsi berformat OpenAI (`POST {basis}/audio/transcriptions`). */
const PENYEDIA_OPENAI = {
  openai: { basis: "https://api.openai.com/v1", model: "whisper-1" },
  groq: { basis: "https://api.groq.com/openai/v1", model: "whisper-large-v3" },
} as const;

type Ambil = typeof fetch;

/**
 * Adapter untuk API transkripsi berformat OpenAI. Meminta `verbose_json` supaya
 * durasi audio ikut dikembalikan; bila tidak ada, dipakai akhir segmen terakhir.
 *
 * BELUM DIUJI terhadap API asli: hanya diuji dengan fetch tiruan.
 */
export function buatTranskriptorOpenAI(
  opsi: { basis: string; model: string; kunci: string },
  ambil: Ambil = fetch,
): Transkriptor {
  return async ({ audio, mimeType }) => {
    const formulir = new FormData();
    const ekstensi = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
    formulir.set("file", new File([audio], `rekaman.${ekstensi}`, { type: mimeType }));
    formulir.set("model", opsi.model);
    formulir.set("language", "id");
    formulir.set("response_format", "verbose_json");

    const respons = await ambil(`${opsi.basis.replace(/\/$/, "")}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${opsi.kunci}` },
      body: formulir,
      signal: AbortSignal.timeout(90_000),
    });
    if (respons.status === 429) throw new GalatBatasPenyedia("Batas transkripsi tercapai");
    if (!respons.ok) {
      // Hanya status: badan galat bisa memuat potongan isi permintaan.
      throw new Error(`Transkripsi gagal dengan status ${respons.status}`);
    }
    const data = (await respons.json()) as {
      text?: unknown;
      duration?: unknown;
      segments?: Array<{ end?: unknown }>;
    };
    if (typeof data.text !== "string") throw new Error("Jawaban transkripsi tidak dikenali");

    const akhirSegmen = data.segments?.at(-1)?.end;
    const detik =
      typeof data.duration === "number"
        ? data.duration
        : typeof akhirSegmen === "number"
          ? akhirSegmen
          : undefined;
    return { teks: data.text, durasiMs: detik === undefined ? undefined : Math.round(detik * 1000) };
  };
}

/**
 * TRANSCRIBE_PROVIDER: "mock" (bawaan), "openai", atau "groq".
 * Penyedia asli butuh TRANSCRIBE_API_KEY (atau GROQ_API_KEY untuk groq);
 * TRANSCRIBE_MODEL dan TRANSCRIBE_BASE_URL opsional.
 */
export function pilihTranskriptor(): Transkriptor {
  const penyedia = process.env.TRANSCRIBE_PROVIDER ?? "mock";
  if (penyedia === "mock") {
    if (!tiruanDiizinkan()) {
      throw new GalatKonfigurasi("TRANSCRIBE_PROVIDER belum diatur untuk produksi");
    }
    return tiruan;
  }
  if (penyedia === "openai" || penyedia === "groq") {
    // Untuk Groq, satu GROQ_API_KEY cukup untuk transkripsi dan ringkasan.
    const kunci =
      process.env.TRANSCRIBE_API_KEY || (penyedia === "groq" ? process.env.GROQ_API_KEY : undefined);
    if (!kunci) throw new GalatKonfigurasi("Kunci API transkripsi belum diisi");
    const bawaan = PENYEDIA_OPENAI[penyedia];
    return buatTranskriptorOpenAI({
      basis: process.env.TRANSCRIBE_BASE_URL ?? bawaan.basis,
      model: process.env.TRANSCRIBE_MODEL ?? bawaan.model,
      kunci,
    });
  }
  throw new GalatKonfigurasi(`Penyedia transkripsi tidak dikenal: ${penyedia}`);
}

export function transcribe(masukan: MasukanTranskripsi): Promise<HasilTranskripsi> {
  return pilihTranskriptor()(masukan);
}
