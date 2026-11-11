import type { Metadata } from "next";
import { Riwayat } from "@/components/fitur/Riwayat";

export const metadata: Metadata = { title: "Riwayat · Voice-to-Todo" };

export default function HalamanRiwayat() {
  return <Riwayat />;
}
