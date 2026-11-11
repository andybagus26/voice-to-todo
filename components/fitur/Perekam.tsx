"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRef } from "react";
import { GelombangSuara } from "@/components/ui/GelombangSuara";
import { Ikon } from "@/components/ui/Ikon";
import { IndikatorMerekam } from "@/components/ui/IndikatorMerekam";
import { KartuPeringatan } from "@/components/ui/KartuPeringatan";
import { Tombol } from "@/components/ui/Tombol";
import type { GalatRekam } from "@/lib/perekam/mime";
import { useRecorder, type HasilRekam } from "@/lib/perekam/useRecorder";
import { formatTimer } from "@/lib/waktu";

type Props = {
  buka: boolean;
  /** Batal: rekaman dibuang. */
  onBatal: () => void;
  /** Selesai (atau batas 10 menit): rekaman diserahkan untuk disimpan lalu diproses. */
  onSelesai: (hasil: HasilRekam) => void;
};

/** Teks galat perekaman. Tidak ada di Figma; lihat docs/design-gaps.md. */
const PESAN_GALAT: Record<GalatRekam, { pesan: string; keterangan: string }> = {
  "izin-ditolak": {
    pesan: "Izin mikrofon ditolak.",
    keterangan: "Izinkan mikrofon di pengaturan browser, lalu coba lagi.",
  },
  "tanpa-mikrofon": {
    pesan: "Mikrofon tidak ditemukan.",
    keterangan: "Sambungkan mikrofon, lalu coba lagi.",
  },
  "tidak-didukung": {
    pesan: "Browser ini tidak bisa merekam.",
    keterangan: "Buka lewat HTTPS atau pakai browser lain.",
  },
  lainnya: {
    pesan: "Rekaman tidak bisa dimulai.",
    keterangan: "Tutup aplikasi lain yang memakai mikrofon, lalu coba lagi.",
  },
};

/** Perekam layar penuh (Figma 2:3). */
export function Perekam({ buka, onBatal, onSelesai }: Props) {
  // Tombol yang membuka perekam, supaya fokus kembali ke sana saat ditutup.
  const pemicu = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={buka} onOpenChange={(terbuka) => !terbuka && onBatal()}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          onInteractOutside={(e) => e.preventDefault()}
          // Esc tidak menutup: rekaman hanya dibuang lewat tombol Batal.
          onEscapeKeyDown={(e) => e.preventDefault()}
          // Fokus awal ke panel, bukan ke tombol Batal, supaya judul yang dibacakan lebih dulu.
          onOpenAutoFocus={(e) => {
            pemicu.current = document.activeElement as HTMLElement | null;
            e.preventDefault();
            (e.currentTarget as HTMLElement).focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (pemicu.current?.isConnected) pemicu.current.focus();
          }}
          tabIndex={-1}
          className="fixed inset-0 z-50 mx-auto flex w-full max-w-[430px] flex-col bg-latar outline-none"
        >
          {/* Dipasang hanya saat terbuka: melepasnya menghentikan mikrofon. */}
          {buka && <IsiPerekam onBatal={onBatal} onSelesai={onSelesai} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function IsiPerekam({ onBatal, onSelesai }: Pick<Props, "onBatal" | "onSelesai">) {
  const { status, galat, berjalanMs, level, selesai, cobaLagi } = useRecorder(onSelesai);
  const merekam = status === "merekam";

  return (
    <>
      <Dialog.Title className="px-4 pt-6 text-judul font-semibold">
        Rekaman baru
      </Dialog.Title>

      {galat ? (
        <>
          <div className="flex-1 px-4 pt-8">
            <KartuPeringatan {...PESAN_GALAT[galat]} onAksi={cobaLagi} />
          </div>
          {/* Batal di posisi yang sama dengan layar merekam: 84px dari dasar layar. */}
          <div className="px-6 pb-[calc(84px+env(safe-area-inset-bottom))]">
            <Tombol varian="garis" ukuran="besar" onClick={onBatal} className="w-full px-0">
              Batal
            </Tombol>
          </div>
        </>
      ) : (
        <>
          {/* Jarak vertikal mengikuti proporsi frame 844px: 148 di atas, 134 di bawah blok tengah. */}
          <div className="min-h-4 flex-[148]" />
          <div className="flex flex-col items-center">
            {merekam ? (
              <IndikatorMerekam />
            ) : (
              <p role="status" className="h-6 text-isi font-medium text-redup">
                Menunggu izin mikrofon...
              </p>
            )}
            <p
              role="timer"
              aria-label="Lama rekaman"
              className="mt-4 text-timer font-semibold tabular-nums"
            >
              {formatTimer(berjalanMs)}
            </p>
            <GelombangSuara aktif={merekam} level={level} className="mt-12" />
            <p className="mt-6 text-kecil font-medium text-redup">Maks 10 menit</p>
          </div>
          <div className="min-h-4 flex-[134]" />

          <p className="px-6 text-center text-kecil font-medium text-redup">
            Jaga layar tetap menyala saat merekam
          </p>
          <div className="mt-[62px] flex gap-3 px-6">
            <Tombol varian="garis" ukuran="besar" onClick={onBatal} className="w-[108px] px-0">
              Batal
            </Tombol>
            <Tombol
              varian="bahaya"
              ukuran="besar"
              onClick={selesai}
              disabled={!merekam}
              className="flex-1 gap-3 px-0"
            >
              <Ikon nama="stop-kecil" />
              Selesai
            </Tombol>
          </div>
          <div className="min-h-6 flex-[84] pb-[env(safe-area-inset-bottom)]" />
        </>
      )}
    </>
  );
}
