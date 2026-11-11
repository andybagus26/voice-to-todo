import type { ReactNode } from "react";
import { NavigasiBawah, type HalamanAktif } from "@/components/ui/NavigasiBawah";

type Props = {
  aktif: HalamanAktif;
  children: ReactNode;
};

/**
 * Kerangka layar mobile: isi di atas, navigasi bawah menempel di dasar layar.
 * Di layar lebar, kolom dipusatkan dengan lebar maksimum 430px.
 */
export function Kerangka({ aktif, children }: Props) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col bg-latar">
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      <NavigasiBawah aktif={aktif} />
    </div>
  );
}
