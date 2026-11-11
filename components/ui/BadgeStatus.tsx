import { cn } from "@/lib/cn";
import type { StatusRekaman } from "@/lib/tipe";

const TAMPILAN: Record<StatusRekaman, { label: string; warna: string }> = {
  selesai: { label: "Selesai", warna: "bg-selesai-latar text-selesai-teks" },
  memproses: {
    label: "Memproses",
    warna: "bg-memproses-latar text-memproses-teks",
  },
  gagal: { label: "Gagal", warna: "bg-gagal-latar text-gagal-teks" },
};

type Props = {
  status: StatusRekaman;
  className?: string;
};

export function BadgeStatus({ status, className }: Props) {
  const { label, warna } = TAMPILAN[status];
  return (
    <span
      className={cn(
        "inline-flex h-[26px] flex-none items-center rounded-full px-3 text-kecil font-medium whitespace-nowrap",
        // Lebar minimum mengikuti Figma: 80 (Selesai, Gagal) dan 112 (Memproses).
        status === "memproses" ? "min-w-28" : "min-w-20",
        warna,
        className,
      )}
    >
      {label}
    </span>
  );
}
