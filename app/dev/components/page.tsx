"use client";

import { useState, type ReactNode } from "react";
import { BadgeStatus } from "@/components/ui/BadgeStatus";
import { Checkbox } from "@/components/ui/Checkbox";
import { ChipKategori } from "@/components/ui/ChipKategori";
import { ChipTenggat } from "@/components/ui/ChipTenggat";
import { DialogKonfirmasi } from "@/components/ui/DialogKonfirmasi";
import { GelombangSuara } from "@/components/ui/GelombangSuara";
import {
  HasilGagal,
  HasilMemproses,
  HasilSelesai,
  type TugasHasil,
} from "@/components/ui/HasilRekaman";
import { IndikatorMerekam } from "@/components/ui/IndikatorMerekam";
import { IndikatorProses } from "@/components/ui/IndikatorProses";
import { KartuToDo } from "@/components/ui/KartuToDo";
import { KontrolSegmen } from "@/components/ui/KontrolSegmen";
import { NavigasiBawah } from "@/components/ui/NavigasiBawah";
import { Tombol } from "@/components/ui/Tombol";
import { TombolRekam } from "@/components/ui/TombolRekam";
import type { FilterTugas } from "@/lib/tipe";

const RINGKASAN =
  "Rapat membahas kekurangan dana acara dan pembagian tugas sponsor. Disepakati proposal dikirim sebelum Jumat dan survei harga vendor dimulai minggu ini.";

const TUGAS_AWAL: TugasHasil[] = [
  { id: "1", teks: "Kirim proposal sponsor ke ketua panitia", selesai: false },
  { id: "2", teks: "Cek harga sewa sound system", selesai: false },
];

export default function HalamanKomponen() {
  const [centang, setCentang] = useState(false);
  const [kartuSelesai, setKartuSelesai] = useState(false);
  const [filter, setFilter] = useState<FilterTugas>("belum");
  const [dialog, setDialog] = useState(false);
  const [tugas, setTugas] = useState(TUGAS_AWAL);

  return (
    <main className="mx-auto flex max-w-[430px] flex-col gap-10 px-4 py-6">
      <header>
        <h1 className="text-utama font-semibold">Komponen</h1>
        <p className="mt-2 text-kecil font-medium text-redup">
          Voice-to-Todo · Inter · Jarak 8 px · Sudut 12 px
        </p>
      </header>

      <Bagian judul="Chip kategori">
        <div className="flex flex-wrap gap-2">
          <ChipKategori kategori="Rapat" />
          <ChipKategori kategori="Kuliah" />
          <ChipKategori kategori="Ide" />
        </div>
      </Bagian>

      <Bagian judul="Chip tenggat">
        <div className="flex flex-wrap gap-2">
          <ChipTenggat waktu="Jumat" />
          <ChipTenggat waktu="Besok" />
          <ChipTenggat waktu="Senin" />
        </div>
      </Bagian>

      <Bagian judul="Badge status">
        <div className="flex flex-wrap gap-2">
          <BadgeStatus status="selesai" />
          <BadgeStatus status="memproses" />
          <BadgeStatus status="gagal" />
        </div>
      </Bagian>

      <Bagian judul="Checkbox">
        <div className="flex gap-2">
          <Checkbox selesai={false} label="Contoh belum" />
          <Checkbox selesai label="Contoh selesai" />
          <Checkbox
            selesai={centang}
            label="Contoh interaktif"
            onUbah={setCentang}
          />
        </div>
      </Bagian>

      <Bagian judul="Kartu to-do">
        <div className="flex flex-col gap-3">
          <KartuToDo
            tugas="Kirim proposal sponsor ke ketua panitia"
            selesai={kartuSelesai}
            kategori="Rapat"
            tenggat="Jumat"
            sumber="dari rapat panitia, 10 Nov"
            onUbah={setKartuSelesai}
          />
          <KartuToDo
            tugas="Kirim proposal sponsor ke ketua panitia"
            selesai
            kategori="Rapat"
            tenggat="Jumat"
            sumber="dari rapat panitia, 10 Nov"
          />
          <KartuToDo
            tugas="Baca bab 3 sebelum kuis"
            selesai={false}
            kategori="Kuliah"
            tenggat="Senin"
            sumber="dari kuliah manajemen, 9 Nov"
          />
          <KartuToDo
            tugas="Ide: tambah fitur pengingat di aplikasi himpunan"
            selesai={false}
            kategori="Ide"
            sumber="dari ide aplikasi, 8 Nov"
          />
        </div>
      </Bagian>

      <Bagian judul="Tombol rekam">
        <div className="flex items-center gap-4">
          <TombolRekam />
          <TombolRekam status="merekam" />
        </div>
      </Bagian>

      <Bagian judul="Kontrol segmen">
        <div className="flex flex-col gap-3">
          <KontrolSegmen aktif={filter} onUbah={setFilter} />
          <KontrolSegmen aktif="selesai" />
        </div>
      </Bagian>

      <Bagian judul="Tombol">
        <div className="flex flex-wrap items-center gap-3">
          <Tombol>Coba lagi</Tombol>
          <Tombol varian="bahaya">Hapus</Tombol>
          <Tombol varian="garis">Batal</Tombol>
          <Tombol varian="garis-aksen">Salin</Tombol>
          <Tombol varian="teks">Batal</Tombol>
          <Tombol varian="teks-bahaya">Hapus rekaman</Tombol>
        </div>
      </Bagian>

      <Bagian judul="Navigasi bawah">
        <div className="flex flex-col gap-3">
          <NavigasiBawah aktif="beranda" className="border" />
          <NavigasiBawah aktif="riwayat" className="border" />
        </div>
      </Bagian>

      <Bagian judul="Hasil rekaman">
        <div className="flex flex-col gap-4">
          <HasilMemproses durasi="2:14" />
          <HasilSelesai
            kategori="Rapat"
            judul="Rapat panitia"
            ringkasan={RINGKASAN}
            poin={[
              "Proposal dikirim sebelum Jumat.",
              "Survei harga vendor minggu ini.",
            ]}
            tugas={tugas}
            onUbahTugas={(id, selesai) =>
              setTugas((lama) =>
                lama.map((t) => (t.id === id ? { ...t, selesai } : t)),
              )
            }
          />
          <HasilGagal />
        </div>
      </Bagian>

      <Bagian judul="Dialog">
        <Tombol varian="garis" onClick={() => setDialog(true)}>
          Buka dialog hapus
        </Tombol>
        <DialogKonfirmasi
          buka={dialog}
          onBukaUbah={setDialog}
          judul="Hapus rekaman ini?"
          deskripsi="Rekaman dan semua to-do-nya akan dihapus permanen."
          labelKonfirmasi="Hapus"
          onKonfirmasi={() => setDialog(false)}
        />
      </Bagian>

      <Bagian judul="Gelombang suara">
        <div className="flex flex-col gap-6">
          <GelombangSuara aktif={false} />
          <GelombangSuara />
        </div>
      </Bagian>

      <Bagian judul="Indikator merekam">
        <IndikatorMerekam />
      </Bagian>

      <Bagian judul="Indikator proses">
        <IndikatorProses />
      </Bagian>
    </main>
  );
}

function Bagian({ judul, children }: { judul: string; children: ReactNode }) {
  return (
    <section data-bagian={judul}>
      <h2 className="mb-3 text-kecil font-medium text-redup">{judul}</h2>
      {children}
    </section>
  );
}
