import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Audit aksesibilitas otomatis (axe, WCAG 2.x A dan AA) di tiap layar dan state,
 * ditambah pemeriksaan keyboard, gerak, dan layar sempit.
 */
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-10T15:00:00+07:00") });
  await page.setExtraHTTPHeaders({
    "x-forwarded-for": `10.7.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
  });
});

async function audit(page: Page, nama: string) {
  await page.evaluate(() => document.fonts.ready);
  const hasil = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    // Lencana pengembangan Next.js, bukan bagian aplikasi.
    .exclude("nextjs-portal")
    .analyze();
  const ringkas = hasil.violations.map((v) => ({
    aturan: v.id,
    dampak: v.impact,
    elemen: v.nodes.map((n) => n.target.join(" ")).slice(0, 4),
    bantuan: v.help,
  }));
  expect(ringkas, `pelanggaran di ${nama}`).toEqual([]);
}

async function isiContoh(page: Page) {
  await page.goto("/dev/data");
  await page.getByRole("button", { name: "Isi data contoh" }).click();
  await expect(page.getByText("4 rekaman · 4 to-do di perangkat ini")).toBeVisible();
}

test("Beranda kosong", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Belum ada to-do", { exact: true })).toBeVisible();
  await audit(page, "Beranda kosong");
});

test("Beranda berisi, tab Selesai, dan kartu sesi", async ({ page }) => {
  await isiContoh(page);
  await page.getByRole("button", { name: "Sesi: hasil" }).click();
  await page.getByRole("link", { name: "Buka Beranda" }).click();
  await expect(page.getByRole("region", { name: /Hasil rekaman/ })).toBeVisible();
  await audit(page, "Beranda dengan hasil");

  await page.getByRole("checkbox", { name: "Baca bab 3 sebelum kuis" }).click();
  await page.getByRole("button", { name: "Selesai", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(1);
  await audit(page, "Beranda tab Selesai");
});

test("Kartu memproses dan gagal", async ({ page }) => {
  await isiContoh(page);
  await page.getByRole("button", { name: "Sesi: memproses" }).click();
  await page.getByRole("link", { name: "Buka Beranda" }).click();
  await expect(page.getByText("Merangkum rekaman 2:14...")).toBeVisible();
  await audit(page, "Beranda memproses");

  await page.goto("/dev/data");
  await page.getByRole("button", { name: "Sesi: gagal" }).click();
  await page.getByRole("link", { name: "Buka Beranda" }).click();
  await expect(page.getByRole("button", { name: "Coba lagi" })).toBeVisible();
  await audit(page, "Beranda gagal");
});

test("Perekam: merekam dan galat izin", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mulai rekam" }).click();
  const perekam = page.getByRole("dialog", { name: "Rekaman baru" });
  await expect(perekam.getByText("Merekam", { exact: true })).toBeVisible();
  await audit(page, "Perekam");
  await perekam.getByRole("button", { name: "Batal" }).click();

  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException("", "NotAllowedError"));
  });
  await page.reload();
  await page.getByRole("button", { name: "Mulai rekam" }).click();
  await expect(perekam.getByRole("alert")).toContainText("Izin mikrofon ditolak.");
  await audit(page, "Perekam izin ditolak");
});

test("Riwayat dan Detail (lihat, transkrip, mode edit, form, dialog)", async ({ page }) => {
  await isiContoh(page);
  await page.getByRole("link", { name: "Buka Riwayat" }).click();
  await expect(page.getByRole("main").getByRole("link")).toHaveCount(4);
  await audit(page, "Riwayat");

  await page.getByRole("link", { name: /14\.30.*Rapat panitia/ }).click();
  await expect(page.getByRole("heading", { name: "Rapat panitia", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Transkrip lengkap" }).click();
  await audit(page, "Detail dengan transkrip terbuka");

  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tambah to-do" })).toBeVisible();
  await audit(page, "Detail mode edit");

  await page.getByRole("button", { name: "Tambah to-do" }).click();
  await expect(page.getByRole("form", { name: "Tambah to-do" })).toBeVisible();
  await audit(page, "Form tambah to-do");
  await page.getByRole("button", { name: "Batal" }).click();

  await page.getByRole("button", { name: "Hapus rekaman" }).click();
  await expect(page.getByRole("dialog", { name: "Hapus rekaman ini?" })).toBeVisible();
  await audit(page, "Dialog hapus");
});

test("Riwayat kosong dan rekaman tidak ditemukan", async ({ page }) => {
  await page.goto("/riwayat");
  await expect(page.getByText("Belum ada rekaman.")).toBeVisible();
  await audit(page, "Riwayat kosong");
  await page.goto("/riwayat/tidak-ada");
  await expect(page.getByRole("heading", { name: "Rekaman tidak ditemukan" })).toBeVisible();
  await audit(page, "Rekaman tidak ditemukan");
});

test("keyboard: seluruh alur to-do bisa dijalankan tanpa mouse", async ({ page }) => {
  await isiContoh(page);
  await page.goto("/riwayat/rapat-panitia");
  await expect(page.getByRole("heading", { name: "Rapat panitia", level: 1 })).toBeVisible();

  const fokusKe = async (nama: string | RegExp, peran: "button" | "checkbox" | "link") => {
    const tujuan = page.getByRole(peran, { name: nama });
    for (let i = 0; i < 40; i++) {
      if (await tujuan.evaluate((el) => el === document.activeElement)) return tujuan;
      await page.keyboard.press("Tab");
    }
    throw new Error(`Tidak terjangkau dengan Tab: ${nama}`);
  };

  // Centang dengan Spasi.
  const kotak = await fokusKe("Kirim proposal sponsor ke ketua panitia", "checkbox");
  await page.keyboard.press("Space");
  await expect(kotak).toHaveAttribute("aria-checked", "true");

  // Fokus terlihat: ada garis luar pada elemen yang difokus.
  expect(
    await kotak.evaluate((el) => {
      const gaya = getComputedStyle(el);
      return gaya.outlineStyle !== "none" && parseFloat(gaya.outlineWidth) >= 2;
    }),
  ).toBe(true);

  // Mode edit, buka form, ketik, simpan dengan Enter pada tombol.
  await fokusKe("Edit", "button");
  await page.keyboard.press("Enter");
  await fokusKe("Tambah to-do", "button");
  await page.keyboard.press("Enter");
  // Fokus langsung masuk ke isian.
  await expect(page.getByRole("textbox", { name: "Isi tugas" })).toBeFocused();
  await page.keyboard.type("Pesan konsumsi rapat");
  await fokusKe("Simpan", "button");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("checkbox", { name: "Pesan konsumsi rapat" })).toBeVisible();

  // Esc membatalkan form edit.
  await page.getByRole("button", { name: "Edit tugas: Pesan konsumsi rapat" }).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.type(" yang dibuang");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("checkbox", { name: "Pesan konsumsi rapat" })).toBeVisible();

  // Dialog hapus: fokus terkunci di dalam dialog, Esc menutup dan mengembalikan fokus.
  const hapus = page.getByRole("button", { name: "Hapus rekaman" });
  await hapus.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Hapus rekaman ini?" });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(hapus).toBeFocused();
});

test("prefers-reduced-motion: gelombang, indikator, dan spinner tidak bergerak", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Mulai rekam" }).click();
  const perekam = page.getByRole("dialog", { name: "Rekaman baru" });
  await expect(perekam.getByText("Merekam", { exact: true })).toBeVisible();

  const durasiAnimasi = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).animationDuration) * 1000);
  // Titik "Merekam" dan batang gelombang: animasi dipangkas menjadi sekejap dan hanya sekali.
  expect(await durasiAnimasi('[role="dialog"] .animate-kedip')).toBeLessThan(1);

  // Batang tetap pada bentuk Figma (tidak mengikuti mikrofon).
  const batang = perekam.locator("div[aria-hidden] > span");
  const tinggi = () => batang.evaluateAll((semua) => semua.map((b) => b.getBoundingClientRect().height));
  const awal = await tinggi();
  expect(awal.slice(0, 3)).toEqual([16, 28, 48]);
  await page.waitForTimeout(400);
  expect(await tinggi()).toEqual(awal);

  await perekam.getByRole("button", { name: "Selesai" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Merangkum" })).toBeVisible();
  expect(await durasiAnimasi("main .animate-putar")).toBeLessThan(1);
});

test("tanpa reduced motion: gelombang mengikuti suara mikrofon", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "Mulai rekam" }).click();
  const perekam = page.getByRole("dialog", { name: "Rekaman baru" });
  await expect(perekam.getByText("Merekam", { exact: true })).toBeVisible();
  const batang = perekam.locator("div[aria-hidden] > span");
  const tinggi = () => batang.evaluateAll((semua) => semua.map((b) => b.getBoundingClientRect().height));
  // Mikrofon palsu Chromium mengeluarkan nada berkala: tinggi batang berubah dari bentuk diam.
  const diam = [16, 28, 48, 24, 64, 80, 44, 72, 96, 60, 36, 68, 84, 48, 24, 56, 40, 72, 32, 16, 40];
  await expect.poll(tinggi, { timeout: 8000 }).not.toEqual(diam);
});

test.describe("layar sempit 320x568", () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test("tidak ada gulir mendatar dan aksi utama tetap terjangkau", async ({ page }) => {
    await isiContoh(page);
    for (const tautan of ["Buka Beranda", "Buka Riwayat"]) {
      await page.goto("/dev/data");
      await page.getByRole("link", { name: tautan }).click();
      await page.waitForLoadState("networkidle");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        tautan,
      ).toBe(true);
    }
    await page.goto("/");
    const rekam = page.getByRole("button", { name: "Mulai rekam" });
    await expect(rekam).toBeInViewport({ ratio: 1 });
    await rekam.click();
    const perekam = page.getByRole("dialog", { name: "Rekaman baru" });
    await expect(perekam.getByRole("button", { name: "Selesai" })).toBeInViewport({ ratio: 1 });
    await expect(perekam.getByRole("button", { name: "Batal" })).toBeInViewport({ ratio: 1 });
    await expect(perekam.getByRole("timer")).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: "e2e/screenshot/mobile/perekam-320.png" });
  });
});

test("area sentuh: semua kontrol minimal 48px, tombol rekam 72px", async ({ page }) => {
  await isiContoh(page);
  await page.goto("/riwayat/rapat-panitia");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tambah to-do" })).toBeVisible();

  const terlaluKecil = await page.evaluate(() => {
    const kontrol = document.querySelectorAll<HTMLElement>(
      "main a, main button, nav a, [role=checkbox]",
    );
    return [...kontrol]
      .filter((el) => el.offsetParent !== null)
      .map((el) => {
        const k = el.getBoundingClientRect();
        // Area sentuh termasuk perluasan lewat ::before (kontrol segmen).
        const sebelum = getComputedStyle(el, "::before");
        const tambahan =
          sebelum.content !== "none" ? -2 * parseFloat(sebelum.top || "0") : 0;
        return {
          nama: el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 30),
          lebar: Math.round(k.width),
          tinggi: Math.round(k.height + (Number.isFinite(tambahan) ? tambahan : 0)),
        };
      })
      .filter((k) => k.tinggi < 48 || k.lebar < 48);
  });
  expect(terlaluKecil).toEqual([]);

  await page.goto("/");
  const rekam = await page.getByRole("button", { name: "Mulai rekam" }).boundingBox();
  expect(rekam).toMatchObject({ width: 72, height: 72 });
  const segmen = page.getByRole("group", { name: "Filter tugas" }).getByRole("button").first();
  // Segmen 40px, area sentuhnya diperluas menjadi 48px.
  expect(
    await segmen.evaluate((el) => {
      const sebelum = getComputedStyle(el, "::before");
      return el.getBoundingClientRect().height - 2 * parseFloat(sebelum.top);
    }),
  ).toBe(48);
});
