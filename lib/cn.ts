/** Gabungkan nama kelas, lewati nilai kosong. */
export function cn(...kelas: Array<string | false | null | undefined>): string {
  return kelas.filter(Boolean).join(" ");
}
