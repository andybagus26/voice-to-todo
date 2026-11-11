"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRef } from "react";
import { Tombol } from "./Tombol";

type Props = {
  buka: boolean;
  onBukaUbah: (buka: boolean) => void;
  judul: string;
  deskripsi: string;
  labelBatal?: string;
  labelKonfirmasi: string;
  onKonfirmasi: () => void;
};

/** Dialog konfirmasi (Figma 2:182). Lebar layar dikurangi 32px, maksimum 440px. */
export function DialogKonfirmasi({
  buka,
  onBukaUbah,
  judul,
  deskripsi,
  labelBatal = "Batal",
  labelKonfirmasi,
  onKonfirmasi,
}: Props) {
  // Dialog dibuka dari state, tanpa Dialog.Trigger, jadi pemicunya dicatat sendiri
  // supaya fokus kembali ke sana saat dialog ditutup.
  const pemicu = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={buka} onOpenChange={onBukaUbah}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-tirai" />
        <Dialog.Content
          onOpenAutoFocus={() => {
            pemicu.current = document.activeElement as HTMLElement | null;
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (pemicu.current?.isConnected) pemicu.current.focus();
          }}
          className="fixed top-1/2 left-1/2 z-50 flex w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-kartu bg-permukaan p-6">
          <Dialog.Title className="text-utama font-semibold">
            {judul}
          </Dialog.Title>
          <Dialog.Description className="text-isi text-redup">
            {deskripsi}
          </Dialog.Description>
          {/* Grid, bukan flex-1: garis tombol Batal membuat lebar flex selisih 2px. */}
          <div className="grid grid-cols-2 gap-4">
            <Dialog.Close asChild>
              <Tombol varian="garis" className="px-0">
                {labelBatal}
              </Tombol>
            </Dialog.Close>
            <Tombol varian="bahaya" className="px-0" onClick={onKonfirmasi}>
              {labelKonfirmasi}
            </Tombol>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
