import { kunciHari } from "@/lib/waktu";

const fmtHari = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", weekday: "long" });

function tambahHari(kunci: string, jumlah: number): string {
  const [tahun, bulan, hari] = kunci.split("-").map(Number);
  return new Date(Date.UTC(tahun, bulan - 1, hari + jumlah)).toISOString().slice(0, 10);
}

function namaHari(kunci: string): string {
  const [tahun, bulan, hari] = kunci.split("-").map(Number);
  return fmtHari.format(Date.UTC(tahun, bulan - 1, hari));
}

/**
 * Tabel tanggal untuk prompt: hari rekaman dan 14 hari sesudahnya (Asia/Jakarta).
 * Model tinggal mencocokkan "Jumat" atau "besok" ke tanggalnya, tanpa berhitung sendiri.
 */
export function tabelKalender(direkamPada: number, jumlahHari = 15): string {
  const hariRekaman = kunciHari(direkamPada);
  return Array.from({ length: jumlahHari }, (_, i) => {
    const kunci = tambahHari(hariRekaman, i);
    const catatan = i === 0 ? " (hari rekaman)" : i === 1 ? " (besok)" : i === 2 ? " (lusa)" : "";
    return `${kunci} = ${namaHari(kunci)}${catatan}`;
  }).join("\n");
}

/** Tanggal kalender pada sekian hari setelah hari rekaman. */
export function hariSetelah(direkamPada: number, jumlah: number): string {
  return tambahHari(kunciHari(direkamPada), jumlah);
}

/** Tanggal hari tertentu (0 = Minggu ... 6 = Sabtu) yang pertama setelah hari rekaman. */
export function hariBerikutnya(direkamPada: number, hari: number): string {
  const awal = kunciHari(direkamPada);
  const [tahun, bulan, tanggal] = awal.split("-").map(Number);
  const hariIni = new Date(Date.UTC(tahun, bulan - 1, tanggal)).getUTCDay();
  const selisih = (hari - hariIni + 7) % 7 || 7;
  return tambahHari(awal, selisih);
}
