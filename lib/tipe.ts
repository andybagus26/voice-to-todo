import type { KodeGalat } from "./hasil";

export const KATEGORI = ["Rapat", "Kuliah", "Ide"] as const;
export type Kategori = (typeof KATEGORI)[number];

export const STATUS_REKAMAN = ["memproses", "selesai", "gagal"] as const;
export type StatusRekaman = (typeof STATUS_REKAMAN)[number];

export type FilterTugas = "belum" | "selesai";

export type Rekaman = {
  id: string;
  /** Waktu rekaman dibuat, epoch milidetik. */
  dibuat: number;
  durasiMs: number;
  status: StatusRekaman;
  /** Judul, kategori, ringkasan, poin, dan transkrip baru ada setelah diproses. */
  judul?: string;
  kategori?: Kategori;
  ringkasan?: string;
  poin?: string[];
  transkrip?: string;
  /** true bila perekaman dihentikan otomatis di batas 10 menit. */
  terpotong?: boolean;
  /** Sebab kegagalan terakhir, bila status "gagal". */
  galat?: KodeGalat;
};

export type Tugas = {
  id: string;
  rekamanId: string;
  teks: string;
  /** Tenggat sebagai tanggal absolut "YYYY-MM-DD" (Asia/Jakarta), atau kosong. */
  tenggat?: string;
  selesai: boolean;
  dibuat: number;
  urutan: number;
};
