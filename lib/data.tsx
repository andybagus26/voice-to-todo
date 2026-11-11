"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { pramuatIkon } from "@/components/ui/Ikon";
import { db } from "./db";
import { pulihkanTersangkut } from "./repo";
import type { Rekaman, Tugas } from "./tipe";
import { kunciHari } from "./waktu";

type Data = {
  /** false sampai IndexedDB selesai dibaca pertama kali. */
  siap: boolean;
  rekaman: Rekaman[];
  tugas: Tugas[];
  /**
   * Rekaman yang dibuat di sesi ini ("Hasil terbaru" di Beranda).
   * Hanya di memori: hilang saat reload dan diganti saat rekaman berikutnya dimulai.
   */
  sesiRekamanId: string | null;
  setSesiRekamanId: (id: string | null) => void;
};

const KOSONG: never[] = [];
const Konteks = createContext<Data | null>(null);

/** Membaca IndexedDB secara langsung (live): tampilan ikut berubah saat data berubah. */
export function PenyediaData({ children }: { children: ReactNode }) {
  const [dipulihkan, setDipulihkan] = useState(false);
  const [sesiRekamanId, setSesiRekamanId] = useState<string | null>(null);

  // Sekali saat aplikasi dibuka: rekaman yang tersangkut "memproses" menjadi "gagal".
  useEffect(() => {
    pramuatIkon();
    pulihkanTersangkut()
      .catch(() => {})
      .finally(() => setDipulihkan(true));
  }, []);

  const rekaman = useLiveQuery(() => db.rekaman.toArray(), []);
  const tugas = useLiveQuery(() => db.tugas.toArray(), []);

  const nilai = useMemo<Data>(
    () => ({
      siap: dipulihkan && rekaman !== undefined && tugas !== undefined,
      rekaman: rekaman ?? KOSONG,
      tugas: tugas ?? KOSONG,
      sesiRekamanId,
      setSesiRekamanId,
    }),
    [dipulihkan, rekaman, tugas, sesiRekamanId],
  );
  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}

export function useData(): Data {
  const data = useContext(Konteks);
  if (!data) throw new Error("useData harus dipakai di dalam PenyediaData");
  return data;
}

/** To-do sebuah rekaman, urut sesuai urutannya. */
export function tugasRekaman(tugas: Tugas[], rekamanId: string): Tugas[] {
  return tugas
    .filter((t) => t.rekamanId === rekamanId)
    .sort((a, b) => a.urutan - b.urutan);
}

function langganMenit(panggil: () => void) {
  const jeda = setInterval(panggil, 60_000);
  return () => clearInterval(jeda);
}

/**
 * Tanggal hari ini di Jakarta ("YYYY-MM-DD"), diperbarui tiap menit.
 * null saat render di server, supaya hasil server dan klien tidak berbeda.
 */
export function useHariIni(): string | null {
  return useSyncExternalStore(
    langganMenit,
    () => kunciHari(Date.now()),
    () => null,
  );
}
