import { expect, test, type Page } from "@playwright/test";

/**
 * Layar dengan data nyata di IndexedDB, dibandingkan dengan frame mobile Figma.
 * Tiap test mulai dari perangkat kosong; data contoh diisi lewat /dev/data.
 * Jam dimulai dari 10 Nov 2026 (tanggal rekaman di Figma) supaya chip tenggat cocok.
 */
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-10T15:00:00+07:00") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Tiap test memakai alamat sendiri supaya pembatas /api/process tidak saling memengaruhi.
  await page.setExtraHTTPHeaders({
    "x-forwarded-for": `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
  });
});

async function potret(page: Page, nama: string) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `e2e/screenshot/mobile/${nama}.png` });
}

/** Mengisi data contoh. Navigasi sesudahnya lewat tautan supaya tidak memuat ulang aplikasi. */
async function isiContoh(page: Page) {
  await page.goto("/dev/data");
  await page.getByRole("button", { name: "Isi data contoh" }).click();
  await expect(page.getByText("4 rekaman · 4 to-do di perangkat ini")).toBeVisible();
}

const bukaBeranda = (page: Page) => page.getByRole("link", { name: "Buka Beranda" }).click();
const bukaRiwayat = (page: Page) => page.getByRole("link", { name: "Buka Riwayat" }).click();
const kartuRiwayat = (page: Page) => page.getByRole("main").getByRole("link");

test("Kosong (2:7): perangkat baru tanpa data", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Belum ada to-do", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Rekam sesuatu, nanti kurangkum jadi daftar tugas."),
  ).toBeVisible();
  await potret(page, "kosong");

  await page.getByRole("link", { name: "Riwayat" }).click();
  await expect(page.getByText("Belum ada rekaman.")).toBeVisible();
});

test("Beranda (2:2)", async ({ page }) => {
  await isiContoh(page);
  await bukaBeranda(page);
  const kartu = page.getByRole("article");
  await expect(kartu).toHaveCount(4);
  await expect(kartu.nth(0)).toContainText("Kirim proposal sponsor ke ketua panitia");
  await expect(kartu.nth(0)).toContainText("Jumat");
  await expect(kartu.nth(0)).toContainText("dari rapat panitia, 10 Nov");
  await expect(kartu.nth(1)).toContainText("Besok");
  await expect(kartu.nth(2)).toContainText("Senin");
  await expect(kartu.nth(3)).toContainText("dari ide aplikasi, 8 Nov");
  await potret(page, "beranda");
});

test("Selesai (2:8): centang bertahan setelah reload", async ({ page }) => {
  await isiContoh(page);
  await bukaBeranda(page);
  await page.getByRole("checkbox", { name: "Kirim proposal sponsor ke ketua panitia" }).click();
  await expect(page.getByRole("article")).toHaveCount(3);

  await page.reload();
  await expect(page.getByRole("article")).toHaveCount(3);
  await page.getByRole("button", { name: "Selesai", exact: true }).click();
  const selesai = page.getByRole("article");
  await expect(selesai).toHaveCount(1);
  await expect(selesai.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
  await expect(selesai.getByText("Kirim proposal sponsor ke ketua panitia")).toHaveCSS(
    "text-decoration-line",
    "line-through",
  );
  await potret(page, "selesai");

  // Batalkan centang: kembali ke tab Belum.
  await selesai.getByRole("checkbox").click();
  await expect(page.getByText("Belum ada to-do yang selesai")).toBeVisible();
  await page.getByRole("button", { name: "Belum", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(4);
});

test("Memproses (2:4)", async ({ page }) => {
  await isiContoh(page);
  await page.getByRole("button", { name: "Sesi: memproses" }).click();
  await bukaBeranda(page);
  await expect(page.getByRole("status").first()).toHaveText("Merangkum rekaman 2:14...");
  await expect(page.getByRole("article")).toHaveCount(4);
  await potret(page, "memproses");
});

test("Hasil (2:5)", async ({ page }) => {
  await isiContoh(page);
  await page.getByRole("button", { name: "Sesi: hasil" }).click();
  await bukaBeranda(page);
  const hasil = page.getByRole("region", { name: "Hasil rekaman Rapat panitia" });
  await expect(hasil.getByText("To-do dari rekaman")).toBeVisible();
  await expect(hasil.getByRole("checkbox")).toHaveCount(2);
  await potret(page, "hasil");

  // Edit membuka detail rekaman itu.
  await hasil.getByRole("button", { name: "Edit" }).click();
  await expect(page).toHaveURL(/\/riwayat\/rapat-panitia$/);
});

test("Gagal (2:6): Coba lagi memproses ulang rekaman yang tersimpan", async ({ page }) => {
  await isiContoh(page);
  await page.getByRole("button", { name: "Sesi: gagal" }).click();
  await bukaBeranda(page);
  await expect(
    page.getByText("Gagal memproses. Rekamanmu aman tersimpan."),
  ).toBeVisible();
  await potret(page, "gagal");

  await page.getByRole("button", { name: "Coba lagi" }).click();
  await expect(page.getByRole("status").first()).toHaveText("Merangkum rekaman 1:06...");
  await expect(page.getByRole("region", { name: /Hasil rekaman/ })).toBeVisible();
});

test("Merekam (2:3)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mulai rekam" }).click();
  const perekam = page.getByRole("dialog", { name: "Rekaman baru" });
  await expect(perekam.getByText("Merekam", { exact: true })).toBeVisible();
  await page.clock.pauseAt(new Date("2026-11-10T15:10:00+07:00"));
  await page.getByRole("button", { name: "Batal" }).click();
  await page.getByRole("button", { name: "Mulai rekam" }).click();
  await expect(perekam.getByText("Merekam", { exact: true })).toBeVisible();
  await expect(perekam.getByRole("timer")).toHaveText("00:00");
  await page.clock.runFor(42_000);
  await expect(perekam.getByRole("timer")).toHaveText("00:42");
  await expect(perekam.getByText("Maks 10 menit")).toBeVisible();
  await expect(perekam.getByText("Jaga layar tetap menyala saat merekam")).toBeVisible();
  await potret(page, "merekam");

  // Batal membuang rekaman: tidak ada yang tersimpan.
  await perekam.getByRole("button", { name: "Batal" }).click();
  await expect(perekam).toBeHidden();
  await expect(page.getByText("Belum ada to-do", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Riwayat" }).click();
  await expect(page.getByText("Belum ada rekaman.")).toBeVisible();
});

test("Rekam lalu Selesai: tersimpan, diproses, dan bertahan setelah reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mulai rekam" }).click();
  const perekam = page.getByRole("dialog", { name: "Rekaman baru" });
  await expect(perekam.getByText("Merekam", { exact: true })).toBeVisible();
  await page.waitForTimeout(1200);
  await page.clock.fastForward(75_000);
  await perekam.getByRole("button", { name: "Selesai" }).click();
  await expect(perekam).toBeHidden();

  // Memproses lewat /api/process (penyedia tiruan), lalu hasil.
  await expect(page.getByRole("status").first()).toHaveText(/Merangkum rekaman 1:1[5-8]\.\.\./);
  await expect(page.getByRole("region", { name: /Hasil rekaman/ })).toBeVisible();
  const kartu = page.getByRole("article");
  await expect(kartu).toHaveCount(2);
  // Tenggat dari server berupa tanggal absolut, ditampilkan relatif terhadap hari ini (10 Nov).
  await expect(kartu.nth(0)).toContainText("Jumat");
  await expect(kartu.nth(1)).toContainText("Besok");
  await expect(kartu.nth(0)).toContainText("dari rapat panitia, 10 Nov");

  // "Hasil terbaru" hanya untuk sesi ini: hilang setelah reload, datanya tetap ada.
  await page.reload();
  await expect(page.getByRole("article")).toHaveCount(2);
  await expect(page.getByRole("region", { name: /Hasil rekaman/ })).toHaveCount(0);

  await page.getByRole("link", { name: "Riwayat" }).click();
  await expect(kartuRiwayat(page)).toHaveCount(1);
  await expect(kartuRiwayat(page).first()).toContainText(/2 to-do · 1:1[5-8]/);
});

test("Kartu hasil hilang saat rekaman berikutnya dimulai", async ({ page }) => {
  await isiContoh(page);
  await page.getByRole("button", { name: "Sesi: hasil" }).click();
  await bukaBeranda(page);
  await expect(page.getByRole("region", { name: /Hasil rekaman/ })).toBeVisible();
  await page.getByRole("button", { name: "Mulai rekam" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Batal" }).click();
  await expect(page.getByRole("region", { name: /Hasil rekaman/ })).toHaveCount(0);
});

test("Riwayat (2:9)", async ({ page }) => {
  await isiContoh(page);
  await bukaRiwayat(page);
  await expect(page.getByRole("heading", { name: "Riwayat", level: 1 })).toBeVisible();
  await expect(page.getByText("Rekamanmu, sudah dirapikan.")).toBeVisible();
  const kartu = kartuRiwayat(page);
  await expect(kartu).toHaveCount(4);
  await expect(kartu.nth(0)).toContainText("10 Nov 2026 · 14.30");
  await expect(kartu.nth(0)).toContainText("2 to-do · 2:14");
  await expect(kartu.nth(1)).toContainText("Merangkum rekaman 2:14...");
  await expect(kartu.nth(2)).toContainText("1 to-do · 8:32");
  await expect(kartu.nth(3)).toContainText("Rekamanmu aman tersimpan.");
  expect((await kartu.nth(0).boundingBox())?.height).toBe(124);
  await potret(page, "riwayat");
});

test("Rekaman yang tersangkut 'memproses' menjadi Gagal saat aplikasi dibuka ulang", async ({ page }) => {
  await isiContoh(page);
  await page.goto("/riwayat");
  const tersangkut = kartuRiwayat(page).nth(1);
  await expect(tersangkut).toContainText("10 Nov 2026 · 13.15");
  await expect(tersangkut).toContainText("Gagal");
  await expect(tersangkut).toContainText("Rekamanmu aman tersimpan.");

  await tersangkut.click();
  await page.getByRole("button", { name: "Coba lagi" }).click();
  await expect(page.getByRole("status").first()).toHaveText("Merangkum rekaman 2:14...");
  await expect(page.getByRole("region", { name: /Hasil rekaman/ })).toBeVisible();
});

test("Detail rekaman (2:10)", async ({ page }) => {
  await isiContoh(page);
  await bukaRiwayat(page);
  await page.getByRole("link", { name: /14\.30.*Rapat panitia/ }).click();
  await expect(page.getByRole("heading", { name: "Rapat panitia", level: 1 })).toBeVisible();
  await expect(page.getByText("10 Nov 2026 · 14.30 · 2:14")).toBeVisible();
  await potret(page, "detail");

  await page.getByRole("button", { name: "Transkrip lengkap" }).click();
  await expect(page.getByRole("region", { name: "Transkrip lengkap" })).toBeVisible();
  await potret(page, "detail-transkrip");

  await page.getByRole("link", { name: "Kembali ke Riwayat" }).click();
  await expect(page).toHaveURL(/\/riwayat$/);
});

test("Detail kuliah (2:2062) memakai data rekaman, bukan placeholder", async ({ page }) => {
  await isiContoh(page);
  await page.goto("/riwayat/kuliah-manajemen");
  await expect(page.getByRole("heading", { name: "Kuliah manajemen", level: 1 })).toBeVisible();
  await expect(page.getByText("9 Nov 2026 · 09.00 · 8:32")).toBeVisible();
  await expect(page.getByText("Kuliah", { exact: true })).toBeVisible();
  await potret(page, "detail-kuliah");
});

test("Detail: alamat rekaman yang tidak ada", async ({ page }) => {
  await page.goto("/riwayat/tidak-ada");
  await expect(page.getByRole("heading", { name: "Rekaman tidak ditemukan" })).toBeVisible();
});

test("Detail: edit, tambah, dan hapus to-do bertahan setelah reload", async ({ page }) => {
  await isiContoh(page);
  await page.goto("/riwayat/rapat-panitia");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await potret(page, "detail-mode-edit");

  // Edit (2:1513)
  await page
    .getByRole("button", { name: "Edit tugas: Kirim proposal sponsor ke ketua panitia" })
    .click();
  const form = page.getByRole("form", { name: "Edit to-do" });
  await expect(form.getByRole("textbox", { name: "Isi tugas" })).toHaveValue(
    "Kirim proposal sponsor ke ketua panitia",
  );
  await potret(page, "edit-to-do");
  await form.getByRole("textbox").fill("Kirim proposal sponsor hari Kamis");
  await form.getByRole("button", { name: "Simpan" }).click();
  await expect(
    page.getByRole("checkbox", { name: "Kirim proposal sponsor hari Kamis" }),
  ).toBeVisible();

  // Batal tidak mengubah apa pun.
  await page.getByRole("button", { name: "Edit tugas: Cek harga sewa sound system" }).click();
  await page.getByRole("textbox").fill("Teks yang dibuang");
  await page.getByRole("button", { name: "Batal" }).click();
  await expect(page.getByRole("checkbox", { name: "Cek harga sewa sound system" })).toBeVisible();

  // Tambah: teks yang diketik itulah yang tersimpan.
  await page.getByRole("button", { name: "Tambah to-do" }).click();
  await page.getByRole("textbox").fill("Survei harga vendor minggu ini");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(3);

  // Hapus.
  await page.getByRole("button", { name: "Hapus tugas: Cek harga sewa sound system" }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(2);

  await page.reload();
  const kotak = page.getByRole("checkbox");
  await expect(kotak).toHaveCount(2);
  await expect(kotak.nth(0)).toHaveAccessibleName("Kirim proposal sponsor hari Kamis");
  await expect(kotak.nth(1)).toHaveAccessibleName("Survei harga vendor minggu ini");

  // To-do baru muncul di Beranda dengan sumber rekamannya, tanpa chip tenggat.
  await page.getByRole("link", { name: "Beranda" }).click();
  const baru = page.getByRole("article").filter({ hasText: "Survei harga vendor minggu ini" });
  await expect(baru).toContainText("dari rapat panitia, 10 Nov");
  await expect(baru).toContainText("Rapat");
  await expect(baru.getByText(/Tenggat/)).toHaveCount(0);
});

test("Detail: hapus rekaman menghapus to-do-nya dan bertahan setelah reload", async ({ page }) => {
  await isiContoh(page);
  await page.goto("/riwayat/rapat-panitia");
  await page.getByRole("button", { name: "Hapus rekaman" }).click();
  const dialog = page.getByRole("dialog", { name: "Hapus rekaman ini?" });
  await expect(
    dialog.getByText("Rekaman dan semua to-do-nya akan dihapus permanen."),
  ).toBeVisible();
  await potret(page, "dialog-hapus-rekaman");

  await dialog.getByRole("button", { name: "Batal" }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: "Hapus rekaman" }).click();
  await dialog.getByRole("button", { name: "Hapus", exact: true }).click();
  await expect(page).toHaveURL(/\/riwayat$/);
  await expect(kartuRiwayat(page)).toHaveCount(3);

  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(2);
  await expect(page.getByText("Kirim proposal sponsor ke ketua panitia")).toHaveCount(0);
});

test("Salin menyalin ringkasan, poin, dan to-do sebagai teks", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await isiContoh(page);
  await page.goto("/riwayat/kuliah-manajemen");
  await page.getByRole("button", { name: "Salin" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Disalin" })).toHaveCount(1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    [
      "Kuliah manajemen",
      "Ringkasan\nKuliah membahas materi bab 3 untuk persiapan kuis. Baca bab 3 sebelum kuis hari Senin.",
      "Poin penting\n• Kuis membahas materi bab 3.\n• Baca materi sebelum hari Senin.",
      "To-do\n[ ] Baca bab 3 sebelum kuis",
    ].join("\n\n"),
  );
});

test("ukuran layar Beranda mengikuti Figma", async ({ page }) => {
  await isiContoh(page);
  await bukaBeranda(page);
  const y = async (teks: string) =>
    (await page.getByText(teks, { exact: true }).first().boundingBox())!.y;
  expect(await y("Voice-to-Todo")).toBe(24);
  expect(await y("To-do kamu")).toBe(96);
  const segmen = await page.getByRole("group", { name: "Filter tugas" }).boundingBox();
  expect(segmen).toMatchObject({ x: 16, y: 136, width: 358, height: 48 });
  const kartu = await page.getByRole("article").first().boundingBox();
  expect(kartu).toMatchObject({ x: 16, y: 192, width: 358, height: 140 });
  const rekam = await page.getByRole("button", { name: "Mulai rekam" }).boundingBox();
  expect(rekam).toMatchObject({ x: 159, y: 656, width: 72, height: 72 });
  expect(await y("Ketuk untuk merekam")).toBe(736);
  const nav = await page.getByRole("navigation", { name: "Navigasi utama" }).boundingBox();
  expect(nav).toMatchObject({ y: 768, height: 76 });
});

test("ukuran layar perekam mengikuti Figma", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mulai rekam" }).click();
  const perekam = page.getByRole("dialog", { name: "Rekaman baru" });
  await expect(perekam.getByText("Merekam", { exact: true })).toBeVisible();
  const kotak = async (lokator: ReturnType<Page["locator"]>) => (await lokator.boundingBox())!;
  expect((await kotak(perekam.getByText("Merekam", { exact: true }))).y).toBe(200);
  expect((await kotak(perekam.getByRole("timer"))).y).toBe(240);
  expect((await kotak(perekam.getByText("Maks 10 menit"))).y).toBe(472);
  expect((await kotak(perekam.getByText("Jaga layar tetap menyala saat merekam"))).y).toBe(624);
  expect(await kotak(perekam.getByRole("button", { name: "Batal" }))).toMatchObject({
    x: 24, y: 704, width: 108, height: 56,
  });
  expect(await kotak(perekam.getByRole("button", { name: "Selesai" }))).toMatchObject({
    x: 144, y: 704, width: 222, height: 56,
  });
});
