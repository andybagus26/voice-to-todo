import { prosesPermintaan } from "@/server/proses";

// Catatan: dengan Cache Components, jangan menambah `export const runtime` di sini.
// Route ini berjalan di runtime Node.js bawaan dan tidak pernah di-cache (POST).
export function POST(permintaan: Request) {
  return prosesPermintaan(permintaan);
}
