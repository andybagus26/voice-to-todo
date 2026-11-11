import { expect, test, type Page } from "@playwright/test";

/**
 * Mengukur geometri komponen terhadap nilai Figma (frame Komponen 2:15), varian mobile.
 * Posisi di Figma dihitung dari tepi luar frame komponen.
 */

async function kotak(page: Page, selector: string, urutan = 0) {
  const k = await page.locator(selector).nth(urutan).boundingBox();
  if (!k) throw new Error(`Tidak ditemukan: ${selector}`);
  return k;
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dev/components");
  await page.evaluate(() => document.fonts.ready);
});

test("chip dan badge setinggi 26px", async ({ page }) => {
  for (const bagian of ["Chip kategori", "Chip tenggat", "Badge status"]) {
    const chip = page.locator(`[data-bagian="${bagian}"] > div > span`);
    await expect(chip).toHaveCount(3);
    for (const k of await chip.evaluateAll((el) =>
      el.map((e) => e.getBoundingClientRect().height),
    )) {
      expect(k, bagian).toBe(26);
    }
  }
  const selesai = await kotak(page, '[data-bagian="Badge status"] span', 0);
  const memproses = await kotak(page, '[data-bagian="Badge status"] span', 1);
  expect(selesai.width).toBe(80);
  expect(memproses.width).toBe(112);
});

test("kartu to-do 358x140, checkbox di 4,16 dan teks di x=60", async ({ page }) => {
  const kartu = await kotak(page, '[data-bagian="Kartu to-do"] article', 0);
  const centang = await kotak(page, '[data-bagian="Kartu to-do"] [role="checkbox"]', 0);
  const teks = await kotak(page, '[data-bagian="Kartu to-do"] article p', 0);
  expect(kartu.width).toBe(358);
  expect(kartu.height).toBe(140);
  expect(centang.x - kartu.x).toBe(4);
  expect(centang.y - kartu.y).toBe(16);
  expect(teks.x - kartu.x).toBe(60);
});

test("kontrol segmen 358x48 dengan segmen 175x40", async ({ page }) => {
  const grup = await kotak(page, '[role="group"][aria-label="Filter tugas"]');
  const belum = await kotak(page, '[role="group"][aria-label="Filter tugas"] button', 0);
  expect(grup.width).toBe(358);
  expect(grup.height).toBe(48);
  expect(belum.width).toBe(175);
  expect(belum.height).toBe(40);
  expect(belum.x - grup.x).toBe(4);
});

test("navigasi bawah: item 160x64", async ({ page }) => {
  const nav = await kotak(page, '[data-bagian="Navigasi bawah"] nav', 0);
  const item = await kotak(page, '[data-bagian="Navigasi bawah"] a', 0);
  // Halaman komponen menambah garis di semua sisi: 75 isi + 2 garis.
  expect(nav.height).toBe(77);
  expect(item.width).toBe(160);
  expect(item.height).toBe(64);
});

test("tombol rekam 72px", async ({ page }) => {
  const tombol = await kotak(page, '[data-bagian="Tombol rekam"] button', 0);
  expect(tombol.width).toBe(72);
  expect(tombol.height).toBe(72);
});

test("hasil rekaman: Salin dan Edit 155x48", async ({ page }) => {
  const hasil = page.locator('[data-bagian="Hasil rekaman"]');
  const salin = await hasil.getByRole("button", { name: "Salin" }).boundingBox();
  const edit = await hasil.getByRole("button", { name: "Edit" }).boundingBox();
  expect(salin?.width).toBe(155);
  expect(edit?.width).toBe(155);
  expect(salin?.height).toBe(48);
});

test("dialog hapus: selebar layar dikurangi 32px, tombol sama lebar", async ({ page }) => {
  await page.getByRole("button", { name: "Buka dialog hapus" }).click();
  const dialog = await page.getByRole("dialog").boundingBox();
  const batal = await page.getByRole("button", { name: "Batal", exact: true }).last().boundingBox();
  const hapus = await page.getByRole("button", { name: "Hapus", exact: true }).last().boundingBox();
  expect(dialog?.width).toBe(358);
  expect(batal?.width).toBe(hapus?.width);
});

test("gelombang suara: 21 batang selebar 6px", async ({ page }) => {
  const batang = page
    .locator('[data-bagian="Gelombang suara"] div[aria-hidden] >> nth=0')
    .locator("span");
  await expect(batang).toHaveCount(21);
  const pertama = await batang.nth(0).boundingBox();
  const kedelapan = await batang.nth(8).boundingBox();
  expect(pertama?.width).toBe(6);
  expect(pertama?.height).toBe(16);
  expect(kedelapan?.height).toBe(96);
});
