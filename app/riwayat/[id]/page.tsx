import type { Metadata } from "next";
import { Suspense } from "react";
import { DetailRekaman } from "@/components/fitur/DetailRekaman";

export const metadata: Metadata = { title: "Detail rekaman · Voice-to-Todo" };

export default function HalamanDetail({ params }: PageProps<"/riwayat/[id]">) {
  // Suspense: id rekaman baru diketahui saat permintaan, datanya ada di perangkat.
  return (
    <Suspense>
      <DetailRekaman params={params} />
    </Suspense>
  );
}
