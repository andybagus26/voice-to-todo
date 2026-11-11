"use client";

import { cn } from "@/lib/cn";
import { Ikon } from "./Ikon";

type Props = {
  status?: "siap" | "merekam";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

/** Tombol rekam bulat 72px (Figma 2:74). */
export function TombolRekam({
  status = "siap",
  onClick,
  disabled,
  className,
}: Props) {
  const merekam = status === "merekam";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={merekam ? "Hentikan rekaman" : "Mulai rekam"}
      className={cn(
        "grid size-[72px] flex-none place-items-center rounded-full bg-rekam shadow-rekam",
        className,
      )}
    >
      <Ikon nama={merekam ? "stop" : "mic-putih"} />
    </button>
  );
}
