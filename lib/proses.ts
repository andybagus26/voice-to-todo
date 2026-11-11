import { SkemaHasilProses, type KodeGalat } from "./hasil";
import { db } from "./db";
import { ambilAudio, simpanHasil, tandaiGagal, tandaiMemproses } from "./repo";

/** Rekaman yang sedang diproses di tab ini, supaya tidak diproses dua kali. */
const sedangDiproses = new Set<string>();

const BATAS_WAKTU_MS = 120_000;

function petakanStatus(status: number): KodeGalat {
  if (status === 429) return "terlalu-sering";
  if (status === 413) return "terlalu-panjang";
  return "server";
}

async function kodeDariRespons(respons: Response): Promise<KodeGalat> {
  try {
    const { galat } = (await respons.json()) as { galat?: string };
    if (galat === "terlalu-panjang" || galat === "terlalu-besar") return "terlalu-panjang";
    if (galat === "tidak-terdengar") return "tidak-terdengar";
    if (galat === "terlalu-sering") return "terlalu-sering";
    if (galat === "belum-dikonfigurasi") return "belum-dikonfigurasi";
  } catch {
    // Badan bukan JSON: pakai kode dari status.
  }
  return petakanStatus(respons.status);
}

/**
 * Memproses rekaman dari audio yang sudah tersimpan di perangkat: mengirimnya ke
 * POST /api/process (transkripsi lalu ringkasan), lalu menulis hasilnya.
 * Dipakai setelah merekam dan oleh tombol "Coba lagi"; tidak pernah merekam ulang.
 */
export async function prosesRekaman(rekamanId: string): Promise<void> {
  if (sedangDiproses.has(rekamanId)) return;
  sedangDiproses.add(rekamanId);
  try {
    const [rekaman, audio] = await Promise.all([
      db.rekaman.get(rekamanId),
      ambilAudio(rekamanId),
    ]);
    if (!rekaman) return;
    if (!audio) {
      await tandaiGagal(rekamanId, "tanpa-audio");
      return;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      await tandaiGagal(rekamanId, "offline");
      return;
    }

    await tandaiMemproses(rekamanId);

    const ekstensi = audio.mimeType.includes("mp4") ? "m4a" : "webm";
    const formulir = new FormData();
    formulir.set(
      "audio",
      new File([audio.blob], `rekaman.${ekstensi}`, { type: audio.mimeType }),
    );
    formulir.set("direkamPada", String(rekaman.dibuat));
    formulir.set("durasiMs", String(rekaman.durasiMs));

    let respons: Response;
    try {
      respons = await fetch("/api/process", {
        method: "POST",
        body: formulir,
        signal: AbortSignal.timeout(BATAS_WAKTU_MS),
      });
    } catch {
      // Jaringan putus di tengah jalan atau batas waktu terlampaui.
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      await tandaiGagal(rekamanId, offline ? "offline" : "server");
      return;
    }

    if (!respons.ok) {
      await tandaiGagal(rekamanId, await kodeDariRespons(respons));
      return;
    }

    const hasil = SkemaHasilProses.safeParse(await respons.json().catch(() => null));
    if (!hasil.success) {
      await tandaiGagal(rekamanId, "server");
      return;
    }
    await simpanHasil(rekamanId, hasil.data);
  } catch {
    await tandaiGagal(rekamanId, "server").catch(() => {});
  } finally {
    sedangDiproses.delete(rekamanId);
  }
}
