import { cn } from "@/lib/cn";

type Props = {
  /** Label relatif, misalnya "Jumat" atau "Besok". */
  waktu: string;
  className?: string;
};

export function ChipTenggat({ waktu, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex h-[26px] flex-none items-center rounded-full bg-netral px-3 text-kecil font-medium whitespace-nowrap text-samar",
        className,
      )}
    >
      <span className="sr-only">Tenggat: </span>
      {waktu}
    </span>
  );
}
