"use client";

import { cn } from "@/lib/cn";
import type { KodeGalat } from "@/lib/hasil";
import type { Kategori } from "@/lib/tipe";
import { Checkbox } from "./Checkbox";
import { ChipKategori } from "./ChipKategori";
import { Ikon } from "./Ikon";
import { IndikatorProses } from "./IndikatorProses";
import { KartuPeringatan } from "./KartuPeringatan";
import { Tombol } from "./Tombol";

/** Kartu hasil rekaman, varian mobile (Figma 2:173). */
const KARTU = "rounded-kartu border border-garis bg-permukaan p-[15px]";

/* ---------- Memproses ---------- */

type MemprosesProps = {
  /** Durasi rekaman, misalnya "2:14". */
  durasi: string;
  className?: string;
};

export function HasilMemproses({ durasi, className }: MemprosesProps) {
  return (
    <section aria-busy="true" className={cn(KARTU, "flex flex-col gap-4", className)}>
      <p
        role="status"
        aria-live="polite"
        className="flex min-h-12 items-start gap-3 text-isi font-medium"
      >
        <IndikatorProses className="mt-0.5" />
        Merangkum rekaman {durasi}...
      </p>
      {/* Lebar baris mengikuti Figma: 310/282/224 dari 326. */}
      <div aria-hidden="true" className="flex flex-col gap-4">
        <span className="h-3 w-[95%] rounded-full bg-netral" />
        <span className="h-3 w-[86.5%] rounded-full bg-netral" />
        <span className="h-3 w-[68.7%] rounded-full bg-netral" />
      </div>
    </section>
  );
}

/* ---------- Gagal ---------- */

/** Keterangan untuk kegagalan yang tidak ada di desain; lihat docs/design-gaps.md. */
const KETERANGAN_GALAT: Partial<Record<KodeGalat, string>> = {
  offline: "Tidak ada koneksi internet. Sambungkan, lalu coba lagi.",
  "terlalu-sering": "Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi.",
  "terlalu-panjang": "Rekaman melebihi batas 10 menit.",
  "tidak-terdengar": "Tidak ada suara yang terdengar di rekaman ini.",
};

type GagalProps = {
  onCobaLagi?: () => void;
  /** Sebab kegagalan, untuk memilih keterangan. */
  galat?: KodeGalat;
  sedangMencoba?: boolean;
  className?: string;
};

export function HasilGagal({
  onCobaLagi,
  galat,
  sedangMencoba,
  className,
}: GagalProps) {
  // Tanpa audio di perangkat, "aman tersimpan" tidak benar dan mencoba lagi tidak berguna.
  if (galat === "tanpa-audio") {
    return (
      <KartuPeringatan
        pesan="Gagal memproses."
        keterangan="Audio rekaman ini tidak ada di perangkat."
        className={className}
      />
    );
  }
  return (
    <KartuPeringatan
      pesan="Gagal memproses. Rekamanmu aman tersimpan."
      keterangan={galat && KETERANGAN_GALAT[galat]}
      onAksi={onCobaLagi}
      aksiNonaktif={sedangMencoba}
      className={className}
    />
  );
}

/* ---------- Selesai ---------- */

export type TugasHasil = { id: string; teks: string; selesai: boolean };

type SelesaiProps = {
  kategori?: Kategori;
  /** Judul rekaman, dipakai sebagai label bagian untuk pembaca layar. */
  judul: string;
  ringkasan: string;
  poin: string[];
  tugas: TugasHasil[];
  onUbahTugas?: (id: string, selesai: boolean) => void;
  onSalin?: () => void;
  onEdit?: () => void;
  /**
   * Mode edit (hanya di Detail): tiap to-do mendapat tombol edit dan hapus,
   * dan baris "Tambah to-do" muncul. Tidak ada di frame mobile Figma; lihat docs/design-gaps.md.
   */
  modeEdit?: boolean;
  onEditTugas?: (id: string) => void;
  onHapusTugas?: (id: string) => void;
  onTambahTugas?: () => void;
  className?: string;
};

export function HasilSelesai({
  kategori,
  judul,
  ringkasan,
  poin,
  tugas,
  onUbahTugas,
  onSalin,
  onEdit,
  modeEdit = false,
  onEditTugas,
  onHapusTugas,
  onTambahTugas,
  className,
}: SelesaiProps) {
  return (
    <section
      aria-label={`Hasil rekaman ${judul}`}
      className={cn(KARTU, "flex flex-col gap-2", className)}
    >
      {kategori && <ChipKategori kategori={kategori} className="self-start" />}
      <p className="text-isi">{ringkasan}</p>
      <h3 className="text-isi font-semibold">Poin penting</h3>
      <ul className="text-isi">
        {poin.map((p, i) => (
          <li key={i} className="flex gap-1.5">
            <span aria-hidden="true">•</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <h3 className="text-isi font-semibold">To-do dari rekaman</h3>
      <ul className="flex flex-col gap-2">
        {tugas.map((t) => (
          <li key={t.id} className="flex min-h-12 gap-1">
            <Checkbox
              selesai={t.selesai}
              label={t.teks}
              onUbah={(nilai) => onUbahTugas?.(t.id, nilai)}
            />
            <span
              className={cn(
                "min-w-0 flex-1 text-isi break-words",
                t.selesai && "line-through opacity-[0.64]",
              )}
            >
              {t.teks}
            </span>
            {modeEdit && (
              <>
                <button
                  type="button"
                  aria-label={`Edit tugas: ${t.teks}`}
                  onClick={() => onEditTugas?.(t.id)}
                  className="grid size-12 flex-none place-items-center rounded-kontrol"
                >
                  <Ikon nama="edit" />
                </button>
                <button
                  type="button"
                  aria-label={`Hapus tugas: ${t.teks}`}
                  onClick={() => onHapusTugas?.(t.id)}
                  className="grid size-12 flex-none place-items-center rounded-kontrol"
                >
                  <Ikon nama="trash" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {modeEdit && (
        <button
          type="button"
          onClick={onTambahTugas}
          className="flex h-12 w-full items-center gap-3 rounded-kartu border border-garis bg-permukaan px-[11px] text-isi text-redup"
        >
          <Ikon nama="plus" />
          Tambah to-do
        </button>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Tombol varian="garis-aksen" onClick={onSalin} className="px-0 text-kecil">
          <Ikon nama="copy" />
          Salin
        </Tombol>
        <Tombol
          varian="garis-aksen"
          onClick={onEdit}
          aria-pressed={modeEdit || undefined}
          className={cn("px-0 text-kecil", modeEdit && "bg-aksen-lembut")}
        >
          <Ikon nama="edit-aksen" />
          Edit
        </Tombol>
      </div>
    </section>
  );
}
