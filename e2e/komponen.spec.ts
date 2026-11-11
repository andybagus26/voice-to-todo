import { expect, test } from "@playwright/test";

// Screenshot halaman komponen untuk dibandingkan dengan Figma (frame 2:15).
test("halaman komponen", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dev/components");
  await expect(page.getByRole("heading", { name: "Komponen" })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `e2e/screenshot/${info.project.name}/komponen.png`,
    fullPage: true,
  });
});

// Potongan per bagian, supaya bisa dibandingkan berdampingan dengan komponen Figma.
for (const bagian of ["Kartu to-do", "Hasil rekaman", "Navigasi bawah"]) {
  test(`bagian ${bagian}`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/dev/components");
    await page.evaluate(() => document.fonts.ready);
    const nama = bagian.toLowerCase().replaceAll(" ", "-");
    await page.locator(`[data-bagian="${bagian}"]`).screenshot({
      path: `e2e/screenshot/${info.project.name}/${nama}.png`,
    });
  });
}

test("dialog hapus", async ({ page }, info) => {
  await page.goto("/dev/components");
  await page.getByRole("button", { name: "Buka dialog hapus" }).click();
  const dialog = page.getByRole("dialog", { name: "Hapus rekaman ini?" });
  await expect(dialog).toBeVisible();
  await page.screenshot({
    path: `e2e/screenshot/${info.project.name}/dialog-hapus.png`,
  });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("area sentuh minimal 48px", async ({ page }) => {
  await page.goto("/dev/components");
  const kotak = await page.getByRole("checkbox").first().boundingBox();
  expect(kotak?.width).toBeGreaterThanOrEqual(48);
  expect(kotak?.height).toBeGreaterThanOrEqual(48);
  const rekam = await page
    .getByRole("button", { name: "Mulai rekam" })
    .first()
    .boundingBox();
  expect(rekam?.width).toBe(72);
});
