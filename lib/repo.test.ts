// @vitest-environment node
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { bukaBasisData, type BasisData } from "./db";
import {
  ambilAudio,
  buatRekaman,
  hapusRekaman,
  hapusTugas,
  isiContoh,
  kosongkan,
  pulihkanTersangkut,
  simpanHasil,
  tambahTugas,
  tandaiGagal,
  tandaiMemproses,
  ubahSelesai,
  ubahTeks,
  type HasilProses,
} from "./repo";

const HASIL: HasilProses = {
  judul: "Rapat panitia",
  kategori: "Rapat",
  ringkasan: "Rapat membahas dana.",
  poin: ["Proposal dikirim sebelum Jumat."],
  transkrip: "isi transkrip",
  tugas: [
    { teks: "Kirim proposal", tenggat: "2026-11-13" },
    { teks: "Cek harga sewa sound system" },
  ],
};

let db: BasisData;
let urutan = 0;

beforeEach(() => {
  db = bukaBasisData(`uji-${urutan++}`);
});
afterEach(async () => {
  await db.delete();
});

const tugasDari = (id: string) => db.tugas.where("rekamanId").equals(id).sortBy("urutan");

describe("rekaman", () => {
  it("menyimpan audio bersama rekaman sebelum diproses", async () => {
    const audio = new Blob(["suara"], { type: "audio/webm" });
    const id = await buatRekaman({ durasiMs: 134_000, audio }, db);

    const rekaman = await db.rekaman.get(id);
    expect(rekaman).toMatchObject({ status: "memproses", durasiMs: 134_000 });
    expect(rekaman?.judul).toBeUndefined();

    const tersimpan = await ambilAudio(id, db);
    expect(tersimpan?.mimeType).toBe("audio/webm");
    expect(tersimpan?.blob.size).toBe(5);
  });

  it("menyimpan hasil: status selesai dan to-do berurutan", async () => {
    const id = await buatRekaman({ durasiMs: 1000 }, db);
    await simpanHasil(id, HASIL, db);

    expect(await db.rekaman.get(id)).toMatchObject({
      status: "selesai",
      judul: "Rapat panitia",
      kategori: "Rapat",
      poin: ["Proposal dikirim sebelum Jumat."],
    });
    const tugas = await tugasDari(id);
    expect(tugas.map((t) => [t.teks, t.tenggat, t.selesai, t.urutan])).toEqual([
      ["Kirim proposal", "2026-11-13", false, 0],
      ["Cek harga sewa sound system", undefined, false, 1],
    ]);
  });

  it("memproses ulang tidak menggandakan to-do", async () => {
    const id = await buatRekaman({ durasiMs: 1000 }, db);
    await simpanHasil(id, HASIL, db);
    await simpanHasil(id, HASIL, db);
    expect(await tugasDari(id)).toHaveLength(2);
  });

  it("gagal lalu coba lagi tetap menyimpan audio", async () => {
    const id = await buatRekaman({ durasiMs: 1000, audio: new Blob(["x"]) }, db);
    await tandaiGagal(id, "offline", db);
    expect(await db.rekaman.get(id)).toMatchObject({ status: "gagal", galat: "offline" });
    await tandaiMemproses(id, db);
    expect((await db.rekaman.get(id))?.status).toBe("memproses");
    expect((await db.rekaman.get(id))?.galat).toBeUndefined();
    expect(await ambilAudio(id, db)).toBeDefined();
  });

  it("memulihkan rekaman yang tersangkut di status memproses", async () => {
    const tersangkut = await buatRekaman({ durasiMs: 1000 }, db);
    const selesai = await buatRekaman({ durasiMs: 1000 }, db);
    await simpanHasil(selesai, HASIL, db);

    expect(await pulihkanTersangkut(db)).toBe(1);
    expect((await db.rekaman.get(tersangkut))?.status).toBe("gagal");
    expect((await db.rekaman.get(selesai))?.status).toBe("selesai");
  });

  it("menghapus rekaman beserta to-do dan audionya, tanpa menyentuh rekaman lain", async () => {
    const a = await buatRekaman({ durasiMs: 1000, audio: new Blob(["a"]) }, db);
    const b = await buatRekaman({ durasiMs: 1000, audio: new Blob(["b"]) }, db);
    await simpanHasil(a, HASIL, db);
    await simpanHasil(b, HASIL, db);

    await hapusRekaman(a, db);

    expect(await db.rekaman.get(a)).toBeUndefined();
    expect(await ambilAudio(a, db)).toBeUndefined();
    expect(await tugasDari(a)).toHaveLength(0);
    expect(await db.rekaman.get(b)).toBeDefined();
    expect(await ambilAudio(b, db)).toBeDefined();
    expect(await tugasDari(b)).toHaveLength(2);
  });

  it("hasil yang datang setelah rekaman dihapus tidak meninggalkan to-do", async () => {
    const id = await buatRekaman({ durasiMs: 1000 }, db);
    await hapusRekaman(id, db);
    await simpanHasil(id, HASIL, db);
    expect(await db.tugas.count()).toBe(0);
    expect(await db.rekaman.count()).toBe(0);
  });
});

describe("to-do", () => {
  let rekamanId: string;
  beforeEach(async () => {
    rekamanId = await buatRekaman({ durasiMs: 1000 }, db);
    await simpanHasil(rekamanId, HASIL, db);
  });

  it("mencentang dan membatalkan centang", async () => {
    const [pertama] = await tugasDari(rekamanId);
    await ubahSelesai(pertama.id, true, db);
    expect((await db.tugas.get(pertama.id))?.selesai).toBe(true);
    await ubahSelesai(pertama.id, false, db);
    expect((await db.tugas.get(pertama.id))?.selesai).toBe(false);
  });

  it("mengubah teks, merapikan spasi, dan menolak teks kosong", async () => {
    const [pertama] = await tugasDari(rekamanId);
    await ubahTeks(pertama.id, "  Kirim proposal hari Kamis  ", db);
    expect((await db.tugas.get(pertama.id))?.teks).toBe("Kirim proposal hari Kamis");
    await ubahTeks(pertama.id, "   ", db);
    expect((await db.tugas.get(pertama.id))?.teks).toBe("Kirim proposal hari Kamis");
  });

  it("menambah di akhir daftar dan menghapus satu to-do", async () => {
    await tambahTugas(rekamanId, "Survei harga vendor minggu ini", db);
    let tugas = await tugasDari(rekamanId);
    expect(tugas.map((t) => t.teks)).toEqual([
      "Kirim proposal",
      "Cek harga sewa sound system",
      "Survei harga vendor minggu ini",
    ]);
    expect(tugas[2].urutan).toBe(2);

    await hapusTugas(tugas[0].id, db);
    tugas = await tugasDari(rekamanId);
    expect(tugas.map((t) => t.teks)).toEqual([
      "Cek harga sewa sound system",
      "Survei harga vendor minggu ini",
    ]);
  });

  it("tidak menambah to-do kosong atau ke rekaman yang tidak ada", async () => {
    expect(await tambahTugas(rekamanId, "   ", db)).toBeUndefined();
    await tambahTugas("tidak-ada", "Tugas yatim", db);
    expect(await db.tugas.count()).toBe(2);
  });
});

describe("alat pengembangan", () => {
  it("mengisi data contoh dan mengosongkan", async () => {
    await buatRekaman({ durasiMs: 1000, audio: new Blob(["x"]) }, db);
    await isiContoh(db);
    expect(await db.rekaman.count()).toBe(4);
    expect(await db.tugas.count()).toBe(4);
    expect(await db.audio.count()).toBe(4);
    await kosongkan(db);
    expect(await db.rekaman.count()).toBe(0);
    expect(await db.tugas.count()).toBe(0);
  });
});
