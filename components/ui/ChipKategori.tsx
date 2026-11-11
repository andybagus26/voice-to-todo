import { cn } from "@/lib/cn";
import type { Kategori } from "@/lib/tipe";

const WARNA: Record<Kategori, string> = {
  Rapat: "bg-rapat-latar text-rapat-teks",
  Kuliah: "bg-kuliah-latar text-kuliah-teks",
  Ide: "bg-ide-latar text-ide-teks",
};

type Props = {
  kategori: Kategori;
  className?: string;
};

export function ChipKategori({ kategori, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex h-[26px] flex-none items-center rounded-full px-3 text-kecil font-medium whitespace-nowrap",
        WARNA[kategori],
        className,
      )}
    >
      {kategori}
    </span>
  );
}
