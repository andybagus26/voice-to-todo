"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";
import { Tombol } from "@/components/ui/Tombol";
import { useData } from "@/lib/data";
import { isiContoh, kosongkan } from "@/lib/repo";

/**
 * Alat pengembangan: mengisi IndexedDB dengan data contoh dari Figma dan
 * mengatur "rekaman sesi ini" untuk meninjau kartu di Beranda.
 * Tidak tersedia di build produksi.
 */
export default function HalamanData() {
  if (process.env.NODE_ENV === "production") notFound();

  const data = useData();
  const [pesan, setPesan] = useState("");

  async function jalankan(aksi: () => Promise<void>, selesai: string) {
    await aksi();
    setPesan(selesai);
  }

  return (
    <main className="mx-auto flex max-w-[430px] flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-utama font-semibold">Data pengembangan</h1>
        <p className="mt-2 text-kecil font-medium text-redup">
          {data.siap
            ? `${data.rekaman.length} rekaman · ${data.tugas.length} to-do di perangkat ini`
            : "Membaca data..."}
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <Tombol onClick={() => jalankan(() => isiContoh(), "Data contoh terisi")}>
          Isi data contoh
        </Tombol>
        <Tombol
          varian="garis"
          onClick={() =>
            jalankan(async () => {
              await kosongkan();
              data.setSesiRekamanId(null);
            }, "Data dikosongkan")
          }
        >
          Kosongkan data
        </Tombol>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-kecil font-medium text-redup">
          Rekaman sesi ini (kartu di atas daftar Beranda)
        </h2>
        {[
          ["rapat-panitia", "Sesi: hasil"],
          ["rapat-siang", "Sesi: memproses"],
          ["ide-aplikasi", "Sesi: gagal"],
        ].map(([id, label]) => (
          <Tombol
            key={id}
            varian="garis"
            aria-pressed={data.sesiRekamanId === id}
            onClick={() => {
              data.setSesiRekamanId(id);
              setPesan(label);
            }}
          >
            {label}
          </Tombol>
        ))}
      </section>

      <p role="status" className="min-h-6 text-isi font-medium text-aksen-kuat">
        {pesan}
      </p>

      <nav aria-label="Buka layar" className="flex gap-4 text-isi font-medium text-aksen">
        <Link href="/" className="underline">
          Buka Beranda
        </Link>
        <Link href="/riwayat" className="underline">
          Buka Riwayat
        </Link>
        <Link href="/dev/components" className="underline">
          Komponen
        </Link>
      </nav>
    </main>
  );
}
