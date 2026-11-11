import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BadgeStatus } from "./BadgeStatus";
import { Checkbox } from "./Checkbox";
import { ChipKategori } from "./ChipKategori";
import { HasilGagal, HasilMemproses } from "./HasilRekaman";
import { KartuToDo } from "./KartuToDo";
import { KontrolSegmen } from "./KontrolSegmen";
import { TombolRekam } from "./TombolRekam";

describe("ChipKategori", () => {
  it.each([
    ["Rapat", "bg-rapat-latar"],
    ["Kuliah", "bg-kuliah-latar"],
    ["Ide", "bg-ide-latar"],
  ] as const)("menampilkan %s dengan warnanya", (kategori, kelas) => {
    render(<ChipKategori kategori={kategori} />);
    expect(screen.getByText(kategori)).toHaveClass(kelas);
  });
});

describe("BadgeStatus", () => {
  it("memakai label Indonesia sesuai Figma", () => {
    render(
      <>
        <BadgeStatus status="selesai" />
        <BadgeStatus status="memproses" />
        <BadgeStatus status="gagal" />
      </>,
    );
    expect(screen.getByText("Selesai")).toBeInTheDocument();
    expect(screen.getByText("Memproses")).toBeInTheDocument();
    expect(screen.getByText("Gagal")).toBeInTheDocument();
  });
});

describe("Checkbox", () => {
  it("melaporkan nilai kebalikan saat diklik", async () => {
    const onUbah = vi.fn();
    render(<Checkbox selesai={false} label="Cek harga" onUbah={onUbah} />);
    const kotak = screen.getByRole("checkbox", { name: "Cek harga" });
    expect(kotak).toHaveAttribute("aria-checked", "false");
    await userEvent.click(kotak);
    expect(onUbah).toHaveBeenCalledWith(true);
  });

  it("bisa dioperasikan dengan keyboard", async () => {
    const onUbah = vi.fn();
    render(<Checkbox selesai label="Cek harga" onUbah={onUbah} />);
    await userEvent.tab();
    await userEvent.keyboard(" ");
    expect(onUbah).toHaveBeenCalledWith(false);
  });
});

describe("KartuToDo", () => {
  it("mencoret tugas yang selesai dan menyembunyikan chip tenggat bila kosong", () => {
    render(
      <KartuToDo
        tugas="Ide: tambah fitur pengingat"
        selesai
        kategori="Ide"
        sumber="dari ide aplikasi, 8 Nov"
      />,
    );
    expect(screen.getByText("Ide: tambah fitur pengingat")).toHaveClass(
      "line-through",
    );
    expect(screen.queryByText(/Tenggat/)).not.toBeInTheDocument();
    expect(screen.getByText("dari ide aplikasi, 8 Nov")).toBeInTheDocument();
  });
});

describe("KontrolSegmen", () => {
  it("menandai segmen aktif dan melaporkan pilihan", async () => {
    const onUbah = vi.fn();
    render(<KontrolSegmen aktif="belum" onUbah={onUbah} />);
    expect(screen.getByRole("button", { name: "Belum" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(screen.getByRole("button", { name: "Selesai" }));
    expect(onUbah).toHaveBeenCalledWith("selesai");
  });
});

describe("TombolRekam", () => {
  it("punya label ARIA sesuai status", () => {
    const { rerender } = render(<TombolRekam />);
    expect(screen.getByRole("button", { name: "Mulai rekam" })).toBeInTheDocument();
    rerender(<TombolRekam status="merekam" />);
    expect(
      screen.getByRole("button", { name: "Hentikan rekaman" }),
    ).toBeInTheDocument();
  });
});

describe("HasilRekaman", () => {
  it("mengumumkan status proses secara sopan", () => {
    render(<HasilMemproses durasi="2:14" />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Merangkum rekaman 2:14...");
  });

  it("menampilkan pesan gagal dan tombol Coba lagi", async () => {
    const onCobaLagi = vi.fn();
    render(<HasilGagal onCobaLagi={onCobaLagi} />);
    expect(
      screen.getByText("Gagal memproses. Rekamanmu aman tersimpan."),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(onCobaLagi).toHaveBeenCalledOnce();
  });
});
