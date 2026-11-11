"use client";

import { KartuRiwayat } from "@/components/fitur/KartuRiwayat";
import { Kerangka } from "@/components/fitur/Kerangka";
import { useData } from "@/lib/data";

export function Riwayat() {
  const data = useData();
  const { rekaman, tugas } = data;
  const urut = [...rekaman].sort((a, b) => b.dibuat - a.dibuat);

  return (
    <Kerangka aktif="riwayat">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-4">
        <p className="text-utama font-semibold">Voice-to-Todo</p>
        <h1 className="mt-10 text-utama font-semibold">Riwayat</h1>
        <p className="mt-2 text-isi text-redup">Rekamanmu, sudah dirapikan.</p>

        {!data.siap ? null : urut.length > 0 ? (
          <ul className="mt-8 flex flex-col gap-3">
            {urut.map((r) => (
              <li key={r.id}>
                <KartuRiwayat
                  rekaman={r}
                  jumlahTugas={tugas.filter((t) => t.rekamanId === r.id).length}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-isi text-redup">Belum ada rekaman.</p>
        )}
      </div>
    </Kerangka>
  );
}
