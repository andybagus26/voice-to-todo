import { cn } from "@/lib/cn";

/** Titik merah berkedip (opasitas 1 ke 0,35) dengan label "Merekam". */
export function IndikatorMerekam({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex h-6 items-center gap-3 text-isi font-medium text-bahaya-teks",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="size-3 animate-kedip rounded-full bg-rekam"
      />
      Merekam
    </p>
  );
}
