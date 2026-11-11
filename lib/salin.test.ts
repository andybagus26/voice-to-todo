import { describe, expect, it } from "vitest";
import { REKAMAN_CONTOH, TUGAS_CONTOH } from "./mock";
import { susunTeksSalin } from "./salin";

describe("susunTeksSalin", () => {
  it("memuat ringkasan, poin, dan to-do sebagai teks", () => {
    const rapat = REKAMAN_CONTOH[0];
    const teks = susunTeksSalin(
      rapat,
      TUGAS_CONTOH.filter((t) => t.rekamanId === rapat.id).map((t, i) => ({
        ...t,
        selesai: i === 0,
      })),
    );
    expect(teks).toBe(
      [
        "Rapat panitia",
        "Ringkasan\nRapat membahas kekurangan dana acara dan pembagian tugas sponsor. Disepakati proposal dikirim sebelum Jumat dan survei harga vendor dimulai minggu ini.",
        "Poin penting\n• Proposal dikirim sebelum Jumat.\n• Survei harga vendor minggu ini.",
        "To-do\n[x] Kirim proposal sponsor ke ketua panitia\n[ ] Cek harga sewa sound system",
      ].join("\n\n"),
    );
  });

  it("melewati bagian yang kosong", () => {
    expect(
      susunTeksSalin({ id: "x", dibuat: 0, durasiMs: 0, status: "gagal" }, []),
    ).toBe("");
  });
});
