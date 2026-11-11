import Dexie, { type EntityTable } from "dexie";
import type { Rekaman, Tugas } from "./tipe";

/**
 * Audio disimpan terpisah supaya daftar rekaman tidak ikut memuat isinya.
 * Disimpan sebagai ArrayBuffer, bukan Blob: Safari di iOS bisa gagal menyimpan
 * Blob hasil MediaRecorder ke IndexedDB.
 */
export type AudioRekaman = {
  rekamanId: string;
  data?: ArrayBuffer;
  mimeType: string;
  /** Bentuk lama (sebelum ArrayBuffer); masih dibaca bila ada. */
  blob?: Blob;
};

export type BasisData = Dexie & {
  rekaman: EntityTable<Rekaman, "id">;
  audio: EntityTable<AudioRekaman, "rekamanId">;
  tugas: EntityTable<Tugas, "id">;
};

/** Penyimpanan per perangkat (IndexedDB). Tanpa login, tanpa sinkronisasi. */
export function bukaBasisData(nama = "voice-to-todo"): BasisData {
  const db = new Dexie(nama) as BasisData;
  db.version(1).stores({
    rekaman: "id, dibuat, status",
    audio: "rekamanId",
    tugas: "id, rekamanId",
  });
  return db;
}

export const db = bukaBasisData();
