import type { Rekaman, Tugas } from "./tipe";

/** Teks polos untuk tombol Salin: ringkasan, poin penting, dan to-do. */
export function susunTeksSalin(rekaman: Rekaman, tugas: Tugas[]): string {
  const bagian: string[] = [];
  if (rekaman.judul) bagian.push(rekaman.judul);
  if (rekaman.ringkasan) bagian.push(`Ringkasan\n${rekaman.ringkasan}`);
  if (rekaman.poin?.length) {
    bagian.push(`Poin penting\n${rekaman.poin.map((p) => `• ${p}`).join("\n")}`);
  }
  if (tugas.length) {
    bagian.push(
      `To-do\n${tugas.map((t) => `${t.selesai ? "[x]" : "[ ]"} ${t.teks}`).join("\n")}`,
    );
  }
  return bagian.join("\n\n");
}
