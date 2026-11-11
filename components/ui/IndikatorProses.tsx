import { cn } from "@/lib/cn";
import { Ikon } from "./Ikon";

/** Spinner 24px. Dekoratif: teks status di sebelahnya yang diumumkan. */
export function IndikatorProses({ className }: { className?: string }) {
  return (
    <span className={cn("inline-block size-6 flex-none animate-putar", className)}>
      <Ikon nama="spinner" />
    </span>
  );
}
