"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { KartuEditToDo } from "@/components/fitur/KartuEditToDo";
import { Kerangka } from "@/components/fitur/Kerangka";
import { Transkrip } from "@/components/fitur/Transkrip";
import { DialogKonfirmasi } from "@/components/ui/DialogKonfirmasi";
import {
  HasilGagal,
  HasilMemproses,
  HasilSelesai,
} from "@/components/ui/HasilRekaman";
import { Tombol } from "@/components/ui/Tombol";
import { tugasRekaman, useData } from "@/lib/data";
import { prosesRekaman } from "@/lib/proses";
import {
  hapusRekaman,
  hapusTugas,
  tambahTugas,
  ubahSelesai,
  ubahTeks,
} from "@/lib/repo";
import { susunTeksSalin } from "@/lib/salin";
import { formatDurasi, formatJam, formatTanggal } from "@/lib/waktu";

type Form = { jenis: "edit"; tugasId: string } | { jenis: "tambah" } | null;

export function DetailRekaman({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const data = useData();
  const rekaman = data.rekaman.find((r) => r.id === id);

  const [modeEdit, setModeEdit] = useState(false);
  const [form, setForm] = useState<Form>(null);
  const [dialogHapus, setDialogHapus] = useState(false);
  const [pesan, setPesan] = useState("");

  if (!data.siap) {
    // Data perangkat belum terbaca: jangan dulu menyimpulkan "tidak ditemukan".
    return (
      <Kerangka aktif="riwayat">
        <div className="px-4 pt-3">
          <TautanKembali />
        </div>
      </Kerangka>
    );
  }

  if (!rekaman) {
    return (
      <Kerangka aktif="riwayat">
        <div className="px-4 pt-3">
          <TautanKembali />
          <h1 className="mt-7 text-utama font-semibold">Rekaman tidak ditemukan</h1>
        </div>
      </Kerangka>
    );
  }

  const tugas = tugasRekaman(data.tugas, rekaman.id);
  const durasi = formatDurasi(rekaman.durasiMs);
  const tugasDiedit =
    form?.jenis === "edit" ? tugas.find((t) => t.id === form.tugasId) : undefined;

  async function salin() {
    if (!rekaman) return;
    await navigator.clipboard?.writeText(susunTeksSalin(rekaman, tugas));
    setPesan("Disalin");
  }

  return (
    <Kerangka aktif="riwayat">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-4">
        <TautanKembali />
        <h1 className="mt-7 text-utama font-semibold">
          {rekaman.judul ?? "Rekaman baru"}
        </h1>
        <p className="mt-2 text-kecil font-medium text-redup">
          {formatTanggal(rekaman.dibuat)} · {formatJam(rekaman.dibuat)} · {durasi}
        </p>
        {rekaman.terpotong && (
          <p className="mt-1 text-kecil font-medium text-redup">
            Rekaman dihentikan di batas 10 menit.
          </p>
        )}

        <div className="mt-[22px] flex flex-col gap-4">
          {form ? (
            <KartuEditToDo
              key={form.jenis === "edit" ? form.tugasId : "tambah"}
              judul={form.jenis === "edit" ? "Edit to-do" : "Tambah to-do"}
              nilaiAwal={tugasDiedit?.teks}
              onBatal={() => setForm(null)}
              onSimpan={async (teks) => {
                if (form.jenis === "edit") await ubahTeks(form.tugasId, teks);
                else await tambahTugas(rekaman.id, teks);
                setForm(null);
              }}
            />
          ) : (
            <>
              {rekaman.status === "memproses" && <HasilMemproses durasi={durasi} />}
              {rekaman.status === "gagal" && (
                <HasilGagal
                  galat={rekaman.galat}
                  onCobaLagi={() => void prosesRekaman(rekaman.id)}
                />
              )}
              {rekaman.status === "selesai" && (
                <HasilSelesai
                  kategori={rekaman.kategori}
                  judul={rekaman.judul ?? "Rekaman baru"}
                  ringkasan={rekaman.ringkasan ?? ""}
                  poin={rekaman.poin ?? []}
                  tugas={tugas}
                  onUbahTugas={ubahSelesai}
                  onSalin={salin}
                  modeEdit={modeEdit}
                  onEdit={() => setModeEdit((lama) => !lama)}
                  onEditTugas={(tugasId) => setForm({ jenis: "edit", tugasId })}
                  onHapusTugas={hapusTugas}
                  onTambahTugas={() => setForm({ jenis: "tambah" })}
                />
              )}
              {rekaman.status === "selesai" && rekaman.transkrip && (
                <Transkrip teks={rekaman.transkrip} />
              )}
              <Tombol
                varian="teks-bahaya"
                onClick={() => setDialogHapus(true)}
                className="self-center"
              >
                Hapus rekaman
              </Tombol>
            </>
          )}
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {pesan}
      </p>

      <DialogKonfirmasi
        buka={dialogHapus}
        onBukaUbah={setDialogHapus}
        judul="Hapus rekaman ini?"
        deskripsi="Rekaman dan semua to-do-nya akan dihapus permanen."
        labelKonfirmasi="Hapus"
        onKonfirmasi={async () => {
          setDialogHapus(false);
          await hapusRekaman(rekaman.id);
          if (data.sesiRekamanId === rekaman.id) data.setSesiRekamanId(null);
          router.push("/riwayat");
        }}
      />
    </Kerangka>
  );
}

function TautanKembali() {
  return (
    <Link
      href="/riwayat"
      aria-label="Kembali ke Riwayat"
      className="flex h-12 w-36 items-center gap-2 rounded-kontrol text-isi font-medium text-aksen"
    >
      <span aria-hidden="true">‹</span>
      Riwayat
    </Link>
  );
}
