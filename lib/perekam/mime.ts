/** Urutan pilihan: WebM/Opus (Chrome, Firefox, Android), lalu MP4/AAC (Safari, iOS). */
export const KANDIDAT_MIME = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
] as const;

/**
 * Tipe MIME pertama yang didukung MediaRecorder di browser ini.
 * undefined berarti biarkan browser memilih bawaannya.
 */
export function pilihMimeType(
  didukung: (tipe: string) => boolean = (tipe) =>
    typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(tipe),
): string | undefined {
  return KANDIDAT_MIME.find((tipe) => {
    try {
      return didukung(tipe);
    } catch {
      return false;
    }
  });
}

/** Batas panjang rekaman: 10 menit. */
export const MAKS_DURASI_MS = 10 * 60 * 1000;

/** 32 kbps cukup untuk suara dan menjaga rekaman 10 menit di sekitar 2,4 MB. */
export const BITRATE_AUDIO = 32_000;

export type GalatRekam =
  | "izin-ditolak"
  | "tanpa-mikrofon"
  | "tidak-didukung"
  | "lainnya";

/** Memetakan galat getUserMedia ke jenis yang ditampilkan ke pengguna. */
export function petakanGalat(galat: unknown): GalatRekam {
  const nama = galat instanceof Error || galat instanceof DOMException ? galat.name : "";
  if (nama === "NotAllowedError" || nama === "SecurityError") return "izin-ditolak";
  if (nama === "NotFoundError" || nama === "OverconstrainedError") return "tanpa-mikrofon";
  return "lainnya";
}
