"use client";

import { useId, useState } from "react";
import { Tombol } from "@/components/ui/Tombol";

type Props = {
  /** "Edit to-do" atau "Tambah to-do". */
  judul: string;
  nilaiAwal?: string;
  onSimpan: (teks: string) => void | Promise<void>;
  onBatal: () => void;
};

/** Kartu form to-do (Figma 2:1556): isian, Simpan, Batal. */
export function KartuEditToDo({ judul, nilaiAwal = "", onSimpan, onBatal }: Props) {
  const idJudul = useId();
  const [teks, setTeks] = useState(nilaiAwal);
  const bersih = teks.trim();

  return (
    <form
      aria-labelledby={idJudul}
      onSubmit={(e) => {
        e.preventDefault();
        if (bersih) onSimpan(bersih);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onBatal();
      }}
      className="rounded-kartu border border-garis bg-permukaan p-[15px]"
    >
      <h2 id={idJudul} className="text-judul leading-6 font-semibold">
        {judul}
      </h2>
      <textarea
        aria-label="Isi tugas"
        value={teks}
        onChange={(e) => setTeks(e.target.value)}
        autoFocus
        // Garis aksen 2px adalah penanda fokusnya (Figma 2:1558), jadi outline bawaan dimatikan.
        rows={3}
        maxLength={280}
        className="mt-6 block h-24 w-full resize-none rounded-kontrol border-2 border-kotak bg-permukaan p-3 text-isi outline-none focus:border-aksen"
      />
      <Tombol type="submit" disabled={!bersih} className="mt-6 w-full px-0">
        Simpan
      </Tombol>
      <Tombol varian="teks" onClick={onBatal} className="mt-2 w-full px-0">
        Batal
      </Tombol>
    </form>
  );
}
