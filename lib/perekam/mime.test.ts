import { describe, expect, it } from "vitest";
import { petakanGalat, pilihMimeType } from "./mime";

describe("pilihMimeType", () => {
  it("memilih WebM/Opus bila didukung", () => {
    expect(pilihMimeType(() => true)).toBe("audio/webm;codecs=opus");
  });

  it("jatuh ke MP4 di Safari", () => {
    expect(pilihMimeType((tipe) => tipe.startsWith("audio/mp4"))).toBe(
      "audio/mp4;codecs=mp4a.40.2",
    );
    expect(pilihMimeType((tipe) => tipe === "audio/mp4")).toBe("audio/mp4");
  });

  it("mengembalikan undefined bila tidak ada yang didukung atau pengecekan melempar galat", () => {
    expect(pilihMimeType(() => false)).toBeUndefined();
    expect(
      pilihMimeType(() => {
        throw new Error("rusak");
      }),
    ).toBeUndefined();
  });
});

describe("petakanGalat", () => {
  it.each([
    ["NotAllowedError", "izin-ditolak"],
    ["SecurityError", "izin-ditolak"],
    ["NotFoundError", "tanpa-mikrofon"],
    ["OverconstrainedError", "tanpa-mikrofon"],
    ["NotReadableError", "lainnya"],
  ])("%s menjadi %s", (nama, jenis) => {
    expect(petakanGalat(new DOMException("", nama))).toBe(jenis);
  });

  it("menganggap nilai tak dikenal sebagai galat lainnya", () => {
    expect(petakanGalat("apa saja")).toBe("lainnya");
  });
});
