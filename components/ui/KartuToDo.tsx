"use client";

import { cn } from "@/lib/cn";
import type { Kategori } from "@/lib/tipe";
import { Checkbox } from "./Checkbox";
import { ChipKategori } from "./ChipKategori";
import { ChipTenggat } from "./ChipTenggat";

type Props = {
  tugas: string;
  selesai: boolean;
  /** Kosong bila rekaman asalnya belum punya kategori. */
  kategori?: Kategori;
  /** Label tenggat relatif; kosong berarti tanpa tenggat. */
  tenggat?: string;
  /** Contoh: "dari rapat panitia, 10 Nov". */
  sumber: string;
  onUbah?: (selesai: boolean) => void;
  className?: string;
};

/** Kartu to-do: susunan bertumpuk, tinggi minimum 140px (Figma 2:64). */
export function KartuToDo({
  tugas,
  selesai,
  kategori,
  tenggat,
  sumber,
  onUbah,
  className,
}: Props) {
  return (
    <article
      className={cn(
        "flex gap-2 rounded-kartu border border-garis bg-permukaan py-[15px] pr-[19px] pl-[3px]",
        className,
      )}
    >
      <Checkbox selesai={selesai} label={tugas} onUbah={onUbah} />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "min-h-12 text-isi break-words",
            selesai && "line-through opacity-[0.64]",
          )}
        >
          {tugas}
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {kategori && <ChipKategori kategori={kategori} />}
            {tenggat && <ChipTenggat waktu={tenggat} />}
          </div>
          <p className="text-kecil font-medium text-redup">{sumber}</p>
        </div>
      </div>
    </article>
  );
}
