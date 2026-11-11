import Link from "next/link";
import { BadgeStatus } from "@/components/ui/BadgeStatus";
import { ChipKategori } from "@/components/ui/ChipKategori";
import type { Rekaman } from "@/lib/tipe";
import { formatDurasi, formatJam, formatTanggal } from "@/lib/waktu";

type Props = {
  rekaman: Rekaman;
  jumlahTugas: number;
};

/** Kartu rekaman di Riwayat (Figma 2:591), tinggi 124px. */
export function KartuRiwayat({ rekaman, jumlahTugas }: Props) {
  const durasi = formatDurasi(rekaman.durasiMs);
  const keterangan =
    rekaman.status === "memproses"
      ? `Merangkum rekaman ${durasi}...`
      : rekaman.status === "gagal"
        ? "Rekamanmu aman tersimpan."
        : (rekaman.ringkasan ?? "");

  return (
    <Link
      href={`/riwayat/${rekaman.id}`}
      className="flex min-h-[124px] flex-col rounded-kartu border border-garis bg-permukaan px-[15px] pt-[11px] pb-[5px]"
    >
      <p className="text-kecil font-medium text-redup">
        {formatTanggal(rekaman.dibuat)} · {formatJam(rekaman.dibuat)}
      </p>
      <h2 className="mt-1.5 truncate text-isi font-semibold">
        {rekaman.judul ?? "Rekaman baru"}
      </h2>
      <p className="mt-1 truncate text-kecil font-medium text-redup">{keterangan}</p>
      {/* Kolom seperti di Figma (chip di 15, badge di 93, info di 221); menyempit di layar kecil. */}
      <div className="mt-2.5 flex items-center gap-2">
        {rekaman.kategori && (
          <span className="min-w-fit shrink basis-[70px]">
            <ChipKategori kategori={rekaman.kategori} />
          </span>
        )}
        <span className="min-w-fit shrink basis-[120px]">
          <BadgeStatus status={rekaman.status} />
        </span>
        <span className="text-kecil font-medium whitespace-nowrap text-redup">
          {rekaman.status === "selesai" ? `${jumlahTugas} to-do · ${durasi}` : durasi}
        </span>
      </div>
    </Link>
  );
}
