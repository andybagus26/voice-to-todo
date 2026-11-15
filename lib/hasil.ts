import { z } from "zod";
import { KATEGORI } from "./tipe";

/**
 * Bentuk hasil pemrosesan yang dikirim server ke browser.
 * Dipakai di dua sisi: server memvalidasi sebelum mengirim, klien sebelum menyimpan.
 */
export const SkemaHasilProses = z.object({
  judul: z.string().trim().min(1).max(120),
  kategori: z.enum(KATEGORI),
  ringkasan: z.string().trim().min(1).max(2000),
  poin: z.array(z.string().trim().min(1).max(300)).max(12),
  transkrip: z.string().max(60_000),
  tugas: z
    .array(
      z.object({
        teks: z.string().trim().min(1).max(280),
        /** Tanggal absolut "YYYY-MM-DD" (Asia/Jakarta). */
        tenggat: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      }),
    )
    .max(30),
});

export type HasilProses = z.infer<typeof SkemaHasilProses>;

/** Kode kegagalan pemrosesan, disimpan di rekaman untuk memilih keterangan yang tampil. */
export const KODE_GALAT = [
  "offline",
  "tanpa-audio",
  "terlalu-sering",
  "terlalu-panjang",
  "tidak-terdengar",
  "belum-dikonfigurasi",
  "server",
] as const;
export type KodeGalat = (typeof KODE_GALAT)[number];

/** Batas yang ditegakkan di klien dan di server. */
export const MAKS_DURASI_MS = 10 * 60 * 1000;
export const TOLERANSI_DURASI_MS = 5_000;
/** 4 MB: di bawah batas badan permintaan Vercel Functions (4,5 MB). Rekaman 10 menit pada 32 kbps sekitar 2,4 MB. */
export const MAKS_UKURAN_AUDIO = 4 * 1024 * 1024;
export const TIPE_AUDIO_DITERIMA = ["audio/webm", "audio/mp4", "audio/ogg"] as const;
