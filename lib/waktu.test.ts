import { describe, expect, it } from "vitest";
import {
  formatDurasi,
  formatJam,
  formatTanggal,
  formatTanggalPendek,
  formatTimer,
  kunciHari,
  labelTenggat,
  selisihHari,
  sumberTugas,
} from "./waktu";

const RAPAT = Date.parse("2026-11-10T14:30:00+07:00");

describe("format waktu (Asia/Jakarta)", () => {
  it("memformat tanggal dan jam seperti di Figma", () => {
    expect(formatTanggal(RAPAT)).toBe("10 Nov 2026");
    expect(formatTanggalPendek(RAPAT)).toBe("10 Nov");
    expect(formatJam(RAPAT)).toBe("14.30");
    expect(formatJam(Date.parse("2026-11-09T09:00:00+07:00"))).toBe("09.00");
  });

  it("memakai tanggal Jakarta, bukan UTC", () => {
    // 23.30 UTC tanggal 9 sudah tanggal 10 pagi di Jakarta.
    expect(kunciHari(Date.parse("2026-11-09T23:30:00Z"))).toBe("2026-11-10");
    // 00.30 WIB tanggal 10 masih tanggal 9 di UTC.
    expect(kunciHari(Date.parse("2026-11-10T00:30:00+07:00"))).toBe("2026-11-10");
  });

  it("memformat durasi dan timer", () => {
    expect(formatDurasi(134_000)).toBe("2:14");
    expect(formatDurasi(512_000)).toBe("8:32");
    expect(formatDurasi(66_000)).toBe("1:06");
    expect(formatTimer(42_000)).toBe("00:42");
    expect(formatTimer(600_000)).toBe("10:00");
  });

  it("menyusun sumber tugas dengan judul huruf kecil", () => {
    expect(sumberTugas("Rapat panitia", RAPAT)).toBe("dari rapat panitia, 10 Nov");
  });
});

describe("labelTenggat", () => {
  const hariIni = "2026-11-10"; // Selasa

  it.each([
    ["2026-11-10", "Hari ini"],
    ["2026-11-11", "Besok"],
    ["2026-11-13", "Jumat"],
    ["2026-11-16", "Senin"],
    ["2026-11-17", "17 Nov"], // 7 hari: nama hari akan ambigu dengan hari ini
    ["2026-11-21", "21 Nov"],
    ["2026-11-08", "8 Nov"], // sudah lewat
    ["2027-01-05", "5 Jan 2027"],
  ])("%s menjadi %s", (tenggat, label) => {
    expect(labelTenggat(tenggat, hariIni)).toBe(label);
  });

  it("memakai tanggal pendek bila hari ini belum diketahui", () => {
    expect(labelTenggat("2026-11-13", null)).toBe("13 Nov");
  });

  it("menghitung selisih hari melewati batas bulan", () => {
    expect(selisihHari("2026-11-29", "2026-12-02")).toBe(3);
  });
});
