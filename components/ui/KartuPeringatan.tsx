import { cn } from "@/lib/cn";
import { Ikon } from "./Ikon";
import { Tombol } from "./Tombol";

type Props = {
  pesan: string;
  keterangan?: string;
  labelAksi?: string;
  onAksi?: () => void;
  aksiNonaktif?: boolean;
  className?: string;
};

/**
 * Kartu peringatan dengan satu aksi. Bentuknya mengikuti "Rekaman gagal diproses"
 * (Figma 2:165) dan dipakai juga untuk galat yang tidak ada di desain.
 */
export function KartuPeringatan({
  pesan,
  keterangan,
  labelAksi = "Coba lagi",
  onAksi,
  aksiNonaktif,
  className,
}: Props) {
  return (
    <section
      className={cn(
        "flex flex-col gap-2 rounded-kartu border border-garis bg-permukaan p-[15px]",
        className,
      )}
    >
      <div role="alert" className="flex min-h-12 items-start gap-3">
        <span className="mt-0.5 flex-none">
          <Ikon nama="warn" />
        </span>
        <div>
          <p className="text-isi font-medium">{pesan}</p>
          {keterangan && (
            <p className="mt-1 text-kecil font-medium text-redup">{keterangan}</p>
          )}
        </div>
      </div>
      {onAksi && (
        <Tombol onClick={onAksi} disabled={aksiNonaktif} className="w-full px-0">
          {labelAksi}
        </Tombol>
      )}
    </section>
  );
}
