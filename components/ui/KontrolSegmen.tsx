"use client";

import { cn } from "@/lib/cn";
import type { FilterTugas } from "@/lib/tipe";

const PILIHAN: Array<{ nilai: FilterTugas; label: string }> = [
  { nilai: "belum", label: "Belum" },
  { nilai: "selesai", label: "Selesai" },
];

type Props = {
  aktif: FilterTugas;
  onUbah?: (nilai: FilterTugas) => void;
  className?: string;
};

/** Filter Belum/Selesai. Tinggi 48px; tiap segmen punya area sentuh setinggi penuh. */
export function KontrolSegmen({ aktif, onUbah, className }: Props) {
  return (
    <div
      role="group"
      aria-label="Filter tugas"
      className={cn(
        "flex h-12 w-full rounded-segmen bg-trek p-1",
        className,
      )}
    >
      {PILIHAN.map(({ nilai, label }) => {
        const terpilih = nilai === aktif;
        return (
          <button
            key={nilai}
            type="button"
            aria-pressed={terpilih}
            onClick={() => onUbah?.(nilai)}
            className={cn(
              // before: memperluas area sentuh ke tinggi penuh 48px.
              "relative h-10 flex-1 rounded-kontrol text-kecil font-medium before:absolute before:-inset-y-1 before:inset-x-0",
              // Tidak aktif memakai "samar": "redup" di atas trek hanya 4,23:1 (di bawah AA).
              terpilih ? "bg-permukaan text-aksen" : "text-samar",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
