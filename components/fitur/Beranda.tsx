"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Kerangka } from "@/components/fitur/Kerangka";
import { Perekam } from "@/components/fitur/Perekam";
import {
  HasilGagal,
  HasilMemproses,
  HasilSelesai,
} from "@/components/ui/HasilRekaman";
import { Ikon } from "@/components/ui/Ikon";
import { KartuPeringatan } from "@/components/ui/KartuPeringatan";
import { KartuToDo } from "@/components/ui/KartuToDo";
import { KontrolSegmen } from "@/components/ui/KontrolSegmen";
import { TombolRekam } from "@/components/ui/TombolRekam";
import { tugasRekaman, useData, useHariIni } from "@/lib/data";
import type { HasilRekam } from "@/lib/perekam/useRecorder";
import { prosesRekaman } from "@/lib/proses";
import { buatRekaman, ubahSelesai } from "@/lib/repo";
import { susunTeksSalin } from "@/lib/salin";
import type { FilterTugas } from "@/lib/tipe";
import { formatDurasi, labelTenggat, sumberTugas } from "@/lib/waktu";

/** IndexedDB melempar QuotaExceededError (kadang terbungkus) saat penyimpanan penuh. */
function penyimpananPenuh(sebab: unknown): boolean {
  const galat = sebab as { name?: string; inner?: { name?: string } } | null;
  return (
    galat?.name === "QuotaExceededError" || galat?.inner?.name === "QuotaExceededError"
  );
}

function namaGalat(sebab: unknown): string {
  const galat = sebab as { name?: string; inner?: { name?: string } } | null;
  return galat?.inner?.name ?? galat?.name ?? "tidak diketahui";
}

export function Beranda() {
  const router = useRouter();
  const data = useData();
  const hariIni = useHariIni();

  const [filter, setFilter] = useState<FilterTugas>("belum");
  const [merekam, setMerekam] = useState(false);
  const [pesanSalin, setPesanSalin] = useState("");
  // Rekaman yang gagal disimpan (mis. penyimpanan penuh): ditahan di memori untuk dicoba lagi.
  const [belumTersimpan, setBelumTersimpan] = useState<{
    hasil: HasilRekam;
    penuh: boolean;
    /** Nama galat dari browser, ditampilkan agar sebabnya bisa dilaporkan. */
    kode: string;
  } | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);

  const rekamanPerId = useMemo(
    () => new Map(data.rekaman.map((r) => [r.id, r])),
    [data.rekaman],
  );

  const daftar = useMemo(
    () =>
      data.tugas
        .filter((t) => (filter === "selesai" ? t.selesai : !t.selesai))
        .map((t) => ({ tugas: t, rekaman: rekamanPerId.get(t.rekamanId) }))
        .sort(
          (a, b) =>
            (b.rekaman?.dibuat ?? 0) - (a.rekaman?.dibuat ?? 0) ||
            a.tugas.urutan - b.tugas.urutan,
        ),
    [data.tugas, filter, rekamanPerId],
  );

  // Kartu di atas daftar: rekaman yang dibuat di sesi ini, hanya di tab "Belum".
  const rekamanSesi =
    filter === "belum" && data.sesiRekamanId
      ? rekamanPerId.get(data.sesiRekamanId)
      : undefined;

  async function salin() {
    if (!rekamanSesi) return;
    await navigator.clipboard?.writeText(
      susunTeksSalin(rekamanSesi, tugasRekaman(data.tugas, rekamanSesi.id)),
    );
    setPesanSalin("Disalin");
  }

  async function simpanLaluProses(hasil: HasilRekam) {
    setMenyimpan(true);
    try {
      // Simpan dulu (rekaman + audio), baru diproses.
      const id = await buatRekaman({
        durasiMs: hasil.durasiMs,
        audio: hasil.blob,
        mimeType: hasil.mimeType,
        terpotong: hasil.terpotong,
      });
      setBelumTersimpan(null);
      data.setSesiRekamanId(id);
      void prosesRekaman(id);
    } catch (sebab) {
      setBelumTersimpan({ hasil, penuh: penyimpananPenuh(sebab), kode: namaGalat(sebab) });
    } finally {
      setMenyimpan(false);
    }
  }

  function selesaiMerekam(hasil: HasilRekam) {
    setMerekam(false);
    setFilter("belum");
    void simpanLaluProses(hasil);
  }

  return (
    <Kerangka aktif="beranda">
      <header className="px-4 pt-6">
        <h1 className="text-utama font-semibold">Voice-to-Todo</h1>
        <h2 className="mt-10 text-judul font-semibold">To-do kamu</h2>
        <KontrolSegmen aktif={filter} onUbah={setFilter} className="mt-3" />
      </header>

      <div className="mt-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-2">
        {filter === "belum" && belumTersimpan && (
          <KartuPeringatan
            className="flex-none"
            pesan="Rekaman belum tersimpan."
            keterangan={
              belumTersimpan.penuh
                ? "Penyimpanan penuh. Hapus beberapa rekaman, lalu coba lagi. Jangan tutup halaman ini."
                : `Jangan tutup halaman ini, lalu coba lagi. (Kode: ${belumTersimpan.kode})`
            }
            aksiNonaktif={menyimpan}
            onAksi={() => void simpanLaluProses(belumTersimpan.hasil)}
          />
        )}
        {rekamanSesi?.terpotong && (
          <p role="status" className="flex-none text-kecil font-medium text-redup">
            Rekaman dihentikan di batas 10 menit.
          </p>
        )}
        {rekamanSesi?.status === "memproses" && (
          <HasilMemproses
            durasi={formatDurasi(rekamanSesi.durasiMs)}
            className="flex-none"
          />
        )}
        {rekamanSesi?.status === "gagal" && (
          <HasilGagal
            className="flex-none"
            galat={rekamanSesi.galat}
            onCobaLagi={() => void prosesRekaman(rekamanSesi.id)}
          />
        )}
        {rekamanSesi?.status === "selesai" && (
          <HasilSelesai
            className="flex-none"
            kategori={rekamanSesi.kategori}
            judul={rekamanSesi.judul ?? "Rekaman baru"}
            ringkasan={rekamanSesi.ringkasan ?? ""}
            poin={rekamanSesi.poin ?? []}
            tugas={tugasRekaman(data.tugas, rekamanSesi.id)}
            onUbahTugas={ubahSelesai}
            onSalin={salin}
            onEdit={() => router.push(`/riwayat/${rekamanSesi.id}`)}
          />
        )}

        {daftar.map(({ tugas, rekaman }) => (
          <KartuToDo
            key={tugas.id}
            className="flex-none"
            tugas={tugas.teks}
            selesai={tugas.selesai}
            kategori={rekaman?.kategori}
            tenggat={tugas.tenggat ? labelTenggat(tugas.tenggat, hariIni) : undefined}
            sumber={sumberTugas(
              rekaman?.judul ?? "Rekaman baru",
              rekaman?.dibuat ?? tugas.dibuat,
            )}
            onUbah={(selesai) => ubahSelesai(tugas.id, selesai)}
          />
        ))}

        {data.siap && daftar.length === 0 && !rekamanSesi && !belumTersimpan && (
          <div className="flex flex-col items-center gap-3 pt-[72px]">
            <span className="grid size-[104px] place-items-center rounded-full bg-aksen-lembut">
              <Ikon nama="mic-besar" />
            </span>
            <p className="text-judul font-semibold">
              {filter === "selesai" ? "Belum ada to-do yang selesai" : "Belum ada to-do"}
            </p>
            {filter === "belum" && (
              <p className="w-[310px] max-w-full text-center text-isi text-redup">
                Rekam sesuatu, nanti kurangkum jadi daftar tugas.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex h-[120px] flex-none flex-col items-center pt-2">
        <TombolRekam
          onClick={() => {
            // Rekaman berikutnya dimulai: kartu hasil sesi sebelumnya hilang.
            data.setSesiRekamanId(null);
            setBelumTersimpan(null);
            setMerekam(true);
          }}
        />
        <p className="mt-2 text-kecil font-medium text-redup">Ketuk untuk merekam</p>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {pesanSalin}
      </p>

      <Perekam
        buka={merekam}
        onBatal={() => setMerekam(false)}
        onSelesai={selesaiMerekam}
      />
    </Kerangka>
  );
}
