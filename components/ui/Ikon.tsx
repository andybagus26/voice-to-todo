const UKURAN = {
  back: 24,
  check: 20,
  copy: 20,
  down: 24,
  edit: 24,
  "edit-aksen": 20,
  history: 24,
  "history-aktif": 24,
  home: 24,
  "home-aktif": 24,
  "mic-besar": 64,
  "mic-putih": 24,
  plus: 24,
  spinner: 24,
  stop: 24,
  "stop-kecil": 20,
  trash: 24,
  warn: 24,
} as const;

export type NamaIkon = keyof typeof UKURAN;

/** Dipegang supaya gambar tetap ada di memori browser. */
const pramuat: HTMLImageElement[] = [];

/**
 * Memuat semua ikon sekali di awal. Tanpa ini, ikon yang baru muncul saat
 * offline (mis. peringatan "Gagal memproses") tidak bisa diambil dari server.
 */
export function pramuatIkon() {
  if (typeof Image === "undefined" || pramuat.length > 0) return;
  for (const nama of Object.keys(UKURAN)) {
    const gambar = new Image();
    gambar.src = `/icons/${nama}.svg`;
    pramuat.push(gambar);
  }
}

type Props = {
  nama: NamaIkon;
  className?: string;
};

/**
 * Ikon dari aset Figma di /public/icons, dipakai apa adanya pada ukuran aslinya.
 * Selalu dekoratif: label diberikan oleh tombol atau tautan pembungkusnya.
 */
export function Ikon({ nama, className }: Props) {
  const ukuran = UKURAN[nama];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG statis kecil, next/image tidak memberi manfaat
    <img
      src={`/icons/${nama}.svg`}
      width={ukuran}
      height={ukuran}
      alt=""
      aria-hidden="true"
      className={className}
      style={{ width: ukuran, height: ukuran, flex: "none" }}
    />
  );
}
