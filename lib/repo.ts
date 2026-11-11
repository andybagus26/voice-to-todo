import { db as dbUtama, type BasisData } from "./db";
import { REKAMAN_CONTOH, TUGAS_CONTOH } from "./mock";
import type { HasilProses, KodeGalat } from "./hasil";
import type { Rekaman, Tugas } from "./tipe";

export type { HasilProses };

/** crypto.randomUUID hanya ada di konteks aman dan browser baru; sediakan cadangan. */
function idBaru(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const acak = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(acak, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Semua operasi tulis ke IndexedDB. Tiap fungsi menerima basis data sebagai
 * argumen terakhir agar bisa diuji dengan basis data terpisah.
 */

/* ---------- Rekaman ---------- */

/**
 * Menyimpan rekaman baru berstatus "memproses" beserta audionya dalam satu transaksi.
 * Dipanggil SEBELUM pemrosesan, supaya "Rekamanmu aman tersimpan" selalu benar.
 */
export async function buatRekaman(
  masukan: {
    durasiMs: number;
    audio?: Blob;
    mimeType?: string;
    terpotong?: boolean;
    dibuat?: number;
  },
  db: BasisData = dbUtama,
): Promise<string> {
  const id = idBaru();
  // Dibaca sebelum transaksi: transaksi IndexedDB tidak boleh menunggu pekerjaan lain.
  const data = masukan.audio ? await bacaIsi(masukan.audio) : undefined;
  await db.transaction("rw", db.rekaman, db.audio, async () => {
    await db.rekaman.add({
      id,
      dibuat: masukan.dibuat ?? Date.now(),
      durasiMs: masukan.durasiMs,
      status: "memproses",
      ...(masukan.terpotong ? { terpotong: true } : {}),
    });
    if (masukan.audio && data) {
      await db.audio.add({
        rekamanId: id,
        data,
        mimeType: masukan.mimeType ?? masukan.audio.type,
      });
    }
  });
  return id;
}

/** Blob.arrayBuffer() belum ada di Safari lama; FileReader dipakai sebagai cadangan. */
function bacaIsi(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
  return new Promise((selesai, gagal) => {
    const pembaca = new FileReader();
    pembaca.onload = () => selesai(pembaca.result as ArrayBuffer);
    pembaca.onerror = () => gagal(pembaca.error);
    pembaca.readAsArrayBuffer(blob);
  });
}

/** Audio sebuah rekaman sebagai Blob siap kirim, atau undefined bila tidak ada. */
export async function ambilAudio(
  rekamanId: string,
  db: BasisData = dbUtama,
): Promise<{ blob: Blob; mimeType: string } | undefined> {
  const baris = await db.audio.get(rekamanId);
  if (!baris) return undefined;
  const blob = baris.data ? new Blob([baris.data], { type: baris.mimeType }) : baris.blob;
  return blob ? { blob, mimeType: baris.mimeType } : undefined;
}

/** Menandai rekaman selesai dan mengganti to-do-nya dengan hasil pemrosesan. */
export async function simpanHasil(
  rekamanId: string,
  hasil: HasilProses,
  db: BasisData = dbUtama,
): Promise<void> {
  await db.transaction("rw", db.rekaman, db.tugas, async () => {
    const jumlah = await db.rekaman.update(rekamanId, {
      status: "selesai",
      galat: undefined,
      judul: hasil.judul,
      kategori: hasil.kategori,
      ringkasan: hasil.ringkasan,
      poin: hasil.poin,
      transkrip: hasil.transkrip,
    });
    // Rekaman sudah dihapus saat masih diproses: jangan tinggalkan to-do yatim.
    if (jumlah === 0) return;
    await db.tugas.where("rekamanId").equals(rekamanId).delete();
    const sekarang = Date.now();
    await db.tugas.bulkAdd(
      hasil.tugas.map((t, urutan) => ({
        id: idBaru(),
        rekamanId,
        teks: t.teks,
        tenggat: t.tenggat,
        selesai: false,
        dibuat: sekarang,
        urutan,
      })),
    );
  });
}

export async function tandaiGagal(
  rekamanId: string,
  galat?: KodeGalat,
  db: BasisData = dbUtama,
) {
  await db.rekaman.update(rekamanId, { status: "gagal", galat });
}

/** Untuk "Coba lagi": kembali ke status memproses. */
export async function tandaiMemproses(rekamanId: string, db: BasisData = dbUtama) {
  await db.rekaman.update(rekamanId, { status: "memproses", galat: undefined });
}

/**
 * Saat aplikasi dibuka, tidak ada pemrosesan yang masih berjalan. Rekaman yang
 * masih "memproses" berarti tab ditutup di tengah proses: tandai gagal supaya
 * tombol "Coba lagi" muncul. Mengembalikan jumlah rekaman yang dipulihkan.
 */
export function pulihkanTersangkut(db: BasisData = dbUtama): Promise<number> {
  return db.rekaman.where("status").equals("memproses").modify({ status: "gagal" });
}

/** Menghapus rekaman beserta to-do dan audionya dalam satu transaksi. */
export async function hapusRekaman(rekamanId: string, db: BasisData = dbUtama) {
  await db.transaction("rw", db.rekaman, db.tugas, db.audio, async () => {
    await db.tugas.where("rekamanId").equals(rekamanId).delete();
    await db.audio.delete(rekamanId);
    await db.rekaman.delete(rekamanId);
  });
}

/* ---------- To-do ---------- */

export async function ubahSelesai(id: string, selesai: boolean, db: BasisData = dbUtama) {
  await db.tugas.update(id, { selesai });
}

export async function ubahTeks(id: string, teks: string, db: BasisData = dbUtama) {
  const bersih = teks.trim();
  if (!bersih) return;
  await db.tugas.update(id, { teks: bersih });
}

export async function hapusTugas(id: string, db: BasisData = dbUtama) {
  await db.tugas.delete(id);
}

/** Menambah to-do di akhir daftar sebuah rekaman. */
export async function tambahTugas(
  rekamanId: string,
  teks: string,
  db: BasisData = dbUtama,
): Promise<string | undefined> {
  const bersih = teks.trim();
  if (!bersih) return undefined;
  const id = idBaru();
  await db.transaction("rw", db.rekaman, db.tugas, async () => {
    if (!(await db.rekaman.get(rekamanId))) return;
    const ada = await db.tugas.where("rekamanId").equals(rekamanId).toArray();
    await db.tugas.add({
      id,
      rekamanId,
      teks: bersih,
      selesai: false,
      dibuat: Date.now(),
      urutan: Math.max(-1, ...ada.map((t) => t.urutan)) + 1,
    });
  });
  return id;
}

/* ---------- Alat pengembangan ---------- */

export async function kosongkan(db: BasisData = dbUtama) {
  await db.transaction("rw", db.rekaman, db.tugas, db.audio, async () => {
    await Promise.all([db.rekaman.clear(), db.tugas.clear(), db.audio.clear()]);
  });
}

/** Mengganti seluruh isi dengan data contoh dari Figma. */
export async function isiContoh(
  db: BasisData = dbUtama,
  rekaman: Rekaman[] = REKAMAN_CONTOH,
  tugas: Tugas[] = TUGAS_CONTOH,
) {
  await db.transaction("rw", db.rekaman, db.tugas, db.audio, async () => {
    await Promise.all([db.rekaman.clear(), db.tugas.clear(), db.audio.clear()]);
    await db.rekaman.bulkAdd(rekaman);
    await db.tugas.bulkAdd(tugas);
    // Audio pengganti (hening) supaya "Coba lagi" pada data contoh bisa dicoba.
    await db.audio.bulkAdd(
      rekaman.map((r) => ({
        rekamanId: r.id,
        data: new ArrayBuffer(2048),
        mimeType: "audio/webm",
      })),
    );
  });
}
