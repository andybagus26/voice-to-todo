import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Varian = "primer" | "bahaya" | "garis" | "garis-aksen" | "teks" | "teks-bahaya";
type Ukuran = "sedang" | "besar";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  varian?: Varian;
  ukuran?: Ukuran;
};

const VARIAN: Record<Varian, string> = {
  primer: "bg-aksen font-semibold text-white",
  bahaya: "bg-bahaya font-semibold text-white",
  garis: "border border-garis bg-permukaan font-semibold text-tinta",
  "garis-aksen": "border border-garis font-medium text-aksen",
  teks: "font-medium text-redup",
  "teks-bahaya": "font-medium text-bahaya",
};

const UKURAN: Record<Ukuran, string> = {
  // 48px: tombol standar. 56px: aksi perekam.
  sedang: "h-12 rounded-kontrol px-6 text-isi",
  besar: "h-14 rounded-kartu px-6 text-isi",
};

export function Tombol({
  varian = "primer",
  ukuran = "sedang",
  className,
  type = "button",
  ...lain
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        // shrink-0, bukan flex-none: pemanggil boleh memberi flex-1 untuk berbagi lebar.
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60",
        VARIAN[varian],
        UKURAN[ukuran],
        className,
      )}
      {...lain}
    />
  );
}
