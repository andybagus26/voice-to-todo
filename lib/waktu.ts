/** Semua tanggal ditampilkan dan dihitung di zona Asia/Jakarta. */
export const ZONA = "Asia/Jakarta";
const LOKAL = "id-ID";

const fmtKunci = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const fmtTanggal = new Intl.DateTimeFormat(LOKAL, {
  timeZone: ZONA,
  day: "numeric",
  month: "short",
  year: "numeric",
});
const fmtTanggalPendek = new Intl.DateTimeFormat(LOKAL, {
  timeZone: ZONA,
  day: "numeric",
  month: "short",
});
const fmtJam = new Intl.DateTimeFormat(LOKAL, {
  timeZone: ZONA,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
// Untuk tanggal kalender ("YYYY-MM-DD") yang sudah absolut: format di UTC agar tidak bergeser.
const fmtHariKalender = new Intl.DateTimeFormat(LOKAL, {
  timeZone: "UTC",
  weekday: "long",
});
const fmtKalenderPendek = new Intl.DateTimeFormat(LOKAL, {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});
const fmtKalenderPanjang = new Intl.DateTimeFormat(LOKAL, {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Tanggal kalender "YYYY-MM-DD" di Jakarta untuk sebuah waktu. */
export function kunciHari(waktu: number | Date): string {
  return fmtKunci.format(waktu);
}

/** "10 Nov 2026" */
export function formatTanggal(waktu: number): string {
  return fmtTanggal.format(waktu);
}

/** "10 Nov" */
export function formatTanggalPendek(waktu: number): string {
  return fmtTanggalPendek.format(waktu);
}

/** "14.30" */
export function formatJam(waktu: number): string {
  return fmtJam.format(waktu).replace(":", ".");
}

/** Durasi "2:14" (menit:detik). */
export function formatDurasi(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Timer perekam "00:42". */
export function formatTimer(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function keUtc(kunci: string): number {
  const [tahun, bulan, hari] = kunci.split("-").map(Number);
  return Date.UTC(tahun, bulan - 1, hari);
}

/** Selisih hari kalender antara dua kunci "YYYY-MM-DD" (ke - dari). */
export function selisihHari(dari: string, ke: string): number {
  return Math.round((keUtc(ke) - keUtc(dari)) / 86_400_000);
}

/**
 * Label chip tenggat relatif terhadap hari ini:
 * "Hari ini", "Besok", nama hari untuk 2 sampai 6 hari ke depan, selebihnya tanggal pendek.
 * Tenggat yang sudah lewat ditampilkan sebagai tanggal biasa.
 * Jika hari ini belum diketahui (render di server), dipakai tanggal pendek.
 */
export function labelTenggat(tenggat: string, hariIni: string | null): string {
  const utc = keUtc(tenggat);
  if (hariIni) {
    const selisih = selisihHari(hariIni, tenggat);
    if (selisih === 0) return "Hari ini";
    if (selisih === 1) return "Besok";
    if (selisih >= 2 && selisih <= 6) return fmtHariKalender.format(utc);
    if (tenggat.slice(0, 4) !== hariIni.slice(0, 4)) {
      return fmtKalenderPanjang.format(utc);
    }
  }
  return fmtKalenderPendek.format(utc);
}

/** "dari rapat panitia, 10 Nov" */
export function sumberTugas(judul: string, dibuat: number): string {
  return `dari ${judul.toLowerCase()}, ${formatTanggalPendek(dibuat)}`;
}
