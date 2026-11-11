/**
 * Pembatas permintaan per kunci (alamat IP) dengan jendela tetap, di memori proses.
 * Cukup untuk satu instance server. Untuk beberapa instance (serverless) perlu
 * penyimpanan bersama; lihat docs/design-gaps.md.
 */
export type Pembatas = {
  /** Mencatat satu permintaan. diizinkan=false bila kuota jendela ini habis. */
  cek: (kunci: string, sekarang?: number) => { diizinkan: boolean; cobaLagiDetik: number };
};

export function buatPembatas(maks: number, jendelaMs: number): Pembatas {
  const catatan = new Map<string, { jumlah: number; berakhir: number }>();

  return {
    cek(kunci, sekarang = Date.now()) {
      // Buang jendela yang sudah lewat supaya peta tidak tumbuh tanpa batas.
      if (catatan.size > 5000) {
        for (const [k, nilai] of catatan) {
          if (nilai.berakhir <= sekarang) catatan.delete(k);
        }
      }
      const ada = catatan.get(kunci);
      if (!ada || ada.berakhir <= sekarang) {
        catatan.set(kunci, { jumlah: 1, berakhir: sekarang + jendelaMs });
        return { diizinkan: true, cobaLagiDetik: 0 };
      }
      if (ada.jumlah >= maks) {
        return {
          diizinkan: false,
          cobaLagiDetik: Math.max(1, Math.ceil((ada.berakhir - sekarang) / 1000)),
        };
      }
      ada.jumlah += 1;
      return { diizinkan: true, cobaLagiDetik: 0 };
    },
  };
}

/** Alamat klien dari header proxy. Hanya dipakai sebagai kunci pembatas. */
export function alamatKlien(permintaan: Request): string {
  const diteruskan = permintaan.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return diteruskan || permintaan.headers.get("x-real-ip") || "lokal";
}
