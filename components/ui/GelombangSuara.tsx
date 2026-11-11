import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

// Tinggi 21 batang pada dua fase di Figma (2:1089): "Awal" dan "Akhir".
const TINGGI_AWAL = [
  16, 28, 48, 24, 64, 80, 44, 72, 96, 60, 36, 68, 84, 48, 24, 56, 40, 72, 32,
  16, 40,
];
const TINGGI_AKHIR = [
  72, 44, 24, 64, 36, 20, 80, 40, 48, 96, 60, 32, 48, 72, 56, 24, 84, 40, 64,
  48, 24,
];

type Props = {
  /** Bergerak di antara dua fase. Jika false, diam di fase awal. */
  aktif?: boolean;
  /**
   * Tinggi batang 0..1 dari mikrofon (21 nilai). Jika diisi, menggantikan animasi.
   */
  level?: number[];
  className?: string;
};

export function GelombangSuara({ aktif = true, level, className }: Props) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex h-24 w-[294px] items-center gap-2", className)}
    >
      {TINGGI_AWAL.map((awal, i) => {
        const gaya: CSSProperties = level
          ? { height: Math.max(16, Math.round((level[i] ?? 0) * 96)) }
          : ({
              height: awal,
              "--tinggi-awal": `${awal}px`,
              "--tinggi-akhir": `${TINGGI_AKHIR[i]}px`,
            } as CSSProperties);
        return (
          <span
            key={i}
            style={gaya}
            className={cn(
              "w-1.5 flex-none rounded-[3px]",
              i % 3 === 0 ? "bg-rekam-lembut" : "bg-rekam",
              aktif && !level && "animate-gelombang",
            )}
          />
        );
      })}
    </div>
  );
}
