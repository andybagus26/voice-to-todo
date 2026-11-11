"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BITRATE_AUDIO,
  MAKS_DURASI_MS,
  petakanGalat,
  pilihMimeType,
  type GalatRekam,
} from "./mime";

export type HasilRekam = {
  blob: Blob;
  mimeType: string;
  durasiMs: number;
  /** true bila dihentikan otomatis di batas 10 menit. */
  terpotong: boolean;
};

type Status = "menyiapkan" | "merekam" | "galat";

const JUMLAH_BATANG = 21;

/**
 * Merekam dari mikrofon selama komponen terpasang.
 * - Mulai saat dipasang; dilepas tanpa memanggil selesai() berarti rekaman dibuang.
 * - Berhenti otomatis di 10 menit dan tetap menyerahkan hasilnya.
 * - Menjaga layar tetap menyala lewat Wake Lock bila didukung.
 * - Track mikrofon dimatikan di semua jalur keluar.
 */
export function useRecorder(onSelesai: (hasil: HasilRekam) => void) {
  const [status, setStatus] = useState<Status>("menyiapkan");
  const [galat, setGalat] = useState<GalatRekam | null>(null);
  const [berjalanMs, setBerjalanMs] = useState(0);
  const [level, setLevel] = useState<number[] | undefined>(undefined);
  const [percobaan, setPercobaan] = useState(0);

  const onSelesaiRef = useRef(onSelesai);
  useEffect(() => {
    onSelesaiRef.current = onSelesai;
  }, [onSelesai]);

  const hentikanRef = useRef<(terpotong: boolean) => void>(() => {});

  useEffect(() => {
    let dilepas = false;
    let stream: MediaStream | undefined;
    let perekam: MediaRecorder | undefined;
    let konteksAudio: AudioContext | undefined;
    let kunciLayar: WakeLockSentinel | undefined;
    let jedaTimer: ReturnType<typeof setInterval> | undefined;
    let bingkai = 0;
    let mulai = 0;
    let akhir: { durasiMs: number; terpotong: boolean } | undefined;
    const potongan: Blob[] = [];

    const gagal = (jenis: GalatRekam) => {
      if (dilepas) return;
      setGalat(jenis);
      setStatus("galat");
    };

    async function mintaKunciLayar() {
      try {
        kunciLayar = await navigator.wakeLock?.request("screen");
      } catch {
        // Tidak didukung atau ditolak (mis. baterai lemah): lanjut tanpa kunci layar.
      }
    }
    // Kunci layar terlepas saat tab disembunyikan; minta lagi saat kembali terlihat.
    const saatTerlihat = () => {
      if (document.visibilityState === "visible" && perekam?.state === "recording") {
        void mintaKunciLayar();
      }
    };

    let sudahBersih = false;
    const bersihkan = () => {
      if (sudahBersih) return; // dipanggil dari onstop dan saat dilepas
      sudahBersih = true;
      clearInterval(jedaTimer);
      cancelAnimationFrame(bingkai);
      document.removeEventListener("visibilitychange", saatTerlihat);
      stream?.getTracks().forEach((track) => track.stop());
      void konteksAudio?.close().catch(() => {});
      void kunciLayar?.release().catch(() => {});
    };

    function pasangGelombang(sumber: MediaStream) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      try {
        konteksAudio = new AudioContext();
        void konteksAudio.resume().catch(() => {});
        const analis = konteksAudio.createAnalyser();
        analis.fftSize = 64;
        analis.smoothingTimeConstant = 0.7;
        konteksAudio.createMediaStreamSource(sumber).connect(analis);
        const frekuensi = new Uint8Array(analis.frequencyBinCount);
        let terakhir = 0;
        const gambar = (waktu: number) => {
          bingkai = requestAnimationFrame(gambar);
          if (waktu - terakhir < 66) return; // sekitar 15 kali per detik
          terakhir = waktu;
          analis.getByteFrequencyData(frekuensi);
          // Frekuensi rendah di tengah, menyebar ke kedua sisi.
          const tengah = (JUMLAH_BATANG - 1) / 2;
          setLevel(
            Array.from({ length: JUMLAH_BATANG }, (_, i) =>
              Math.min(1, (frekuensi[Math.abs(i - tengah) + 1] / 255) * 1.3),
            ),
          );
        };
        bingkai = requestAnimationFrame(gambar);
      } catch {
        // Tanpa analisis audio, gelombang memakai animasi bawaan.
      }
    }

    async function jalankan() {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        gagal("tidak-didukung");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      } catch (sebab) {
        gagal(petakanGalat(sebab));
        return;
      }
      if (dilepas) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const mimeType = pilihMimeType();
      try {
        perekam = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: BITRATE_AUDIO,
        });
      } catch {
        try {
          perekam = new MediaRecorder(stream);
        } catch {
          bersihkan();
          gagal("tidak-didukung");
          return;
        }
      }

      const rekam = perekam;
      rekam.ondataavailable = (peristiwa) => {
        if (peristiwa.data.size > 0) potongan.push(peristiwa.data);
      };
      rekam.onerror = () => {
        bersihkan();
        gagal("lainnya");
      };
      rekam.onstop = () => {
        bersihkan();
        if (dilepas || !akhir) return; // Batal: rekaman dibuang.
        const tipe = rekam.mimeType || mimeType || "audio/webm";
        const blob = new Blob(potongan, { type: tipe });
        if (blob.size === 0) {
          gagal("lainnya");
          return;
        }
        onSelesaiRef.current({ blob, mimeType: tipe, ...akhir });
      };

      hentikanRef.current = (terpotong) => {
        if (rekam.state === "inactive" || akhir) return;
        akhir = {
          durasiMs: Math.min(Date.now() - mulai, MAKS_DURASI_MS),
          terpotong,
        };
        clearInterval(jedaTimer);
        rekam.stop();
      };

      rekam.start(1000);
      mulai = Date.now();
      setBerjalanMs(0);
      setStatus("merekam");

      jedaTimer = setInterval(() => {
        const berjalan = Date.now() - mulai;
        if (berjalan >= MAKS_DURASI_MS) {
          setBerjalanMs(MAKS_DURASI_MS);
          hentikanRef.current(true);
        } else {
          setBerjalanMs(berjalan);
        }
      }, 250);

      document.addEventListener("visibilitychange", saatTerlihat);
      void mintaKunciLayar();
      pasangGelombang(stream);
    }

    void jalankan();

    return () => {
      dilepas = true;
      hentikanRef.current = () => {};
      if (perekam && perekam.state !== "inactive") perekam.stop();
      bersihkan();
    };
  }, [percobaan]);

  const selesai = useCallback(() => hentikanRef.current(false), []);
  const cobaLagi = useCallback(() => {
    setGalat(null);
    setStatus("menyiapkan");
    setLevel(undefined);
    setPercobaan((n) => n + 1);
  }, []);

  return { status, galat, berjalanMs, level, selesai, cobaLagi };
}
