import type { Rekaman, Tugas } from "./tipe";

/**
 * Data contoh sesuai frame mobile Figma (Beranda 2:2, Riwayat 2:9, Detail 2:10 dan 2:2062).
 * Dipakai untuk mengisi IndexedDB dari /dev/data dan untuk test.
 *
 * Catatan: di Figma baris "Memproses" dan "Gagal" sudah berjudul dan berkategori.
 * Data nyata belum punya keduanya sebelum diproses; lihat docs/design-gaps.md.
 */
const wib = (iso: string) => Date.parse(`${iso}+07:00`);

export const REKAMAN_CONTOH: Rekaman[] = [
  {
    id: "rapat-panitia",
    dibuat: wib("2026-11-10T14:30:00"),
    durasiMs: 134_000,
    status: "selesai",
    judul: "Rapat panitia",
    kategori: "Rapat",
    ringkasan:
      "Rapat membahas kekurangan dana acara dan pembagian tugas sponsor. Disepakati proposal dikirim sebelum Jumat dan survei harga vendor dimulai minggu ini.",
    poin: ["Proposal dikirim sebelum Jumat.", "Survei harga vendor minggu ini."],
    transkrip:
      "Rapat membahas kekurangan dana acara dan pembagian tugas sponsor. Disepakati proposal dikirim sebelum Jumat dan survei harga vendor dimulai minggu ini.",
  },
  {
    id: "rapat-siang",
    dibuat: wib("2026-11-10T13:15:00"),
    durasiMs: 134_000,
    status: "memproses",
    judul: "Rapat panitia",
    kategori: "Rapat",
  },
  {
    id: "kuliah-manajemen",
    dibuat: wib("2026-11-09T09:00:00"),
    durasiMs: 512_000,
    status: "selesai",
    judul: "Kuliah manajemen",
    kategori: "Kuliah",
    ringkasan:
      "Kuliah membahas materi bab 3 untuk persiapan kuis. Baca bab 3 sebelum kuis hari Senin.",
    poin: ["Kuis membahas materi bab 3.", "Baca materi sebelum hari Senin."],
    transkrip:
      "Kuliah membahas materi bab 3 untuk persiapan kuis. Baca bab 3 sebelum kuis hari Senin.",
  },
  {
    id: "ide-aplikasi",
    dibuat: wib("2026-11-08T20:10:00"),
    durasiMs: 66_000,
    status: "gagal",
    judul: "Ide aplikasi",
    kategori: "Ide",
  },
];

export const TUGAS_CONTOH: Tugas[] = [
  {
    id: "t1",
    rekamanId: "rapat-panitia",
    teks: "Kirim proposal sponsor ke ketua panitia",
    tenggat: "2026-11-13",
    selesai: false,
    dibuat: wib("2026-11-10T14:33:00"),
    urutan: 0,
  },
  {
    id: "t2",
    rekamanId: "rapat-panitia",
    teks: "Cek harga sewa sound system",
    tenggat: "2026-11-11",
    selesai: false,
    dibuat: wib("2026-11-10T14:33:00"),
    urutan: 1,
  },
  {
    id: "t3",
    rekamanId: "kuliah-manajemen",
    teks: "Baca bab 3 sebelum kuis",
    tenggat: "2026-11-16",
    selesai: false,
    dibuat: wib("2026-11-09T09:10:00"),
    urutan: 0,
  },
  {
    id: "t4",
    rekamanId: "ide-aplikasi",
    teks: "Ide: tambah fitur pengingat di aplikasi himpunan",
    selesai: false,
    dibuat: wib("2026-11-08T20:12:00"),
    urutan: 0,
  },
];
