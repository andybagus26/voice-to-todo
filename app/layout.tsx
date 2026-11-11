import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PenyediaData } from "@/lib/data";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Voice-to-Todo",
  description:
    "Rekam suara, lalu dapatkan ringkasan, poin penting, dan daftar to-do.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8fafc",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <PenyediaData>{children}</PenyediaData>
      </body>
    </html>
  );
}
