"use client";

import { cn } from "@/lib/cn";
import { Ikon } from "./Ikon";

type Props = {
  selesai: boolean;
  /** Nama tugas, dipakai sebagai label untuk pembaca layar. */
  label: string;
  onUbah?: (selesai: boolean) => void;
  disabled?: boolean;
  className?: string;
};

/** Area sentuh 48px dengan kotak centang 24px di tengah. */
export function Checkbox({ selesai, label, onUbah, disabled, className }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selesai}
      aria-label={label}
      disabled={disabled}
      onClick={() => onUbah?.(!selesai)}
      className={cn(
        "relative grid size-12 flex-none place-items-center rounded-kontrol",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-6 place-items-center rounded-centang border-2",
          selesai ? "border-aksen bg-aksen" : "border-kotak bg-permukaan",
        )}
      >
        {selesai && <Ikon nama="check" />}
      </span>
    </button>
  );
}
