import { expect, test, type Page } from "@playwright/test";

/**
 * Perekaman dengan mikrofon palsu Chromium (lihat playwright.config.ts).
 * Jam bisa dimajukan lewat page.clock; MediaRecorder tetap berjalan di waktu nyata.
 */
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-10T15:00:00+07:00") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Tiap test memakai alamat sendiri supaya pembatas /api/process tidak saling memengaruhi.
  await page.setExtraHTTPHeaders({
    "x-forwarded-for": `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
  });
});

/** Mencatat semua stream mikrofon dan permintaan kunci layar yang dibuat halaman. */
async function pasangPencatat(page: Page) {
  await page.addInitScript(() => {
    const catatan = { stream: [] as MediaStream[], kunci: 0, lepas: 0 };
    Object.assign(window, { __catatan: catatan });
    const asli = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (batasan) => {
      const stream = await asli(batasan);
      catatan.stream.push(stream);
      return stream;
    };
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: {
        request: async () => {
          catatan.kunci += 1;
          return {
            release: async () => {
              catatan.lepas += 1;
            },
          };
        },
      },
    });
  });
}

const catatan = (page: Page) =>
  page.evaluate(() => {
    const c = (window as unknown as {
      __catatan: { stream: MediaStream[]; kunci: number; lepas: number };
    }).__catatan;
    return {
      trackAktif: c.stream.flatMap((s) => s.getTracks()).filter((t) => t.readyState === "live")
        .length,
      jumlahStream: c.stream.length,
      kunci: c.kunci,
      lepas: c.lepas,
    };
  });

/** Membaca tabel IndexedDB langsung, tanpa lewat kode aplikasi. */
const bacaTabel = (page: Page, tabel: string) =>
  page.evaluate(
    (nama) =>
      new Promise<Array<Record<string, unknown>>>((selesai, gagal) => {
        const buka = indexedDB.open("voice-to-todo");
        buka.onerror = () => gagal(buka.error);
        buka.onsuccess = () => {
          const minta = buka.result.transaction(nama).objectStore(nama).getAll();
          minta.onerror = () => gagal(minta.error);
          minta.onsuccess = () =>
            selesai(
              minta.result.map((baris: Record<string, unknown>) => ({
                ...baris,
                data: undefined,
                // Audio harus tersimpan sebagai ArrayBuffer (bukan Blob) agar aman di iOS.
                ukuran: (baris.data as ArrayBuffer | undefined)?.byteLength,
                berupaBlob: baris.blob instanceof Blob,
              })),
            );
        };
      }),
    tabel,
  );

const perekam = (page: Page) => page.getByRole("dialog", { name: "Rekaman baru" });

test("merekam lalu Selesai: audio tersimpan di IndexedDB sebelum diproses", async ({ page }) => {
  await pasangPencatat(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Mulai rekam" }).click();
  await expect(perekam(page).getByText("Merekam", { exact: true })).toBeVisible();

  // Biarkan MediaRecorder mengumpulkan suara sungguhan, lalu majukan jam.
  await page.waitForTimeout(1500);
  await page.clock.fastForward(40_000);
  await expect(perekam(page).getByRole("timer")).toHaveText(/00:4[1-3]/);
  expect((await catatan(page)).kunci).toBeGreaterThanOrEqual(1);

  await perekam(page).getByRole("button", { name: "Selesai" }).click();
  await expect(perekam(page)).toBeHidden();
  await expect(page.getByRole("status").first()).toHaveText(/Merangkum rekaman 0:4[1-3]\.\.\./);

  // Saat masih "memproses", audionya sudah ada di perangkat.
  const audio = await bacaTabel(page, "audio");
  expect(audio).toHaveLength(1);
  expect(audio[0].mimeType).toMatch(/^audio\/webm/);
  expect(audio[0].ukuran as number).toBeGreaterThan(500);
  expect(audio[0].berupaBlob).toBe(false);
  const [rekaman] = await bacaTabel(page, "rekaman");
  expect(rekaman.id).toBe(audio[0].rekamanId);

  // Mikrofon dimatikan dan kunci layar dilepas.
  const akhir = await catatan(page);
  expect(akhir.trackAktif).toBe(0);
  expect(akhir.lepas).toBe(akhir.kunci);
});

test("Batal membuang rekaman dan mematikan mikrofon", async ({ page }) => {
  await pasangPencatat(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Mulai rekam" }).click();
  await expect(perekam(page).getByText("Merekam", { exact: true })).toBeVisible();
  await page.waitForTimeout(1200);

  await perekam(page).getByRole("button", { name: "Batal" }).click();
  await expect(perekam(page)).toBeHidden();
  await expect(page.getByText("Belum ada to-do", { exact: true })).toBeVisible();

  expect(await bacaTabel(page, "rekaman")).toHaveLength(0);
  expect(await bacaTabel(page, "audio")).toHaveLength(0);
  const akhir = await catatan(page);
  expect(akhir.jumlahStream).toBeGreaterThanOrEqual(1);
  expect(akhir.trackAktif).toBe(0);
});

test("Esc tidak membuang rekaman yang sedang berjalan", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mulai rekam" }).click();
  await expect(perekam(page).getByText("Merekam", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(perekam(page)).toBeVisible();
});

test("berhenti otomatis di 10 menit dan tetap menyimpan rekaman", async ({ page }) => {
  await pasangPencatat(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Mulai rekam" }).click();
  await expect(perekam(page).getByText("Merekam", { exact: true })).toBeVisible();
  await page.waitForTimeout(1200);

  await page.clock.fastForward(9 * 60_000 + 58_000);
  await expect(perekam(page).getByRole("timer")).toHaveText(/09:5\d/);
  await page.clock.fastForward(3_000);

  await expect(perekam(page)).toBeHidden();
  await expect(page.getByText("Rekaman dihentikan di batas 10 menit.")).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Merangkum" })).toHaveText(
    "Merangkum rekaman 10:00...",
  );

  const [rekaman] = await bacaTabel(page, "rekaman");
  expect(rekaman).toMatchObject({ durasiMs: 600_000, terpotong: true });
  expect(await bacaTabel(page, "audio")).toHaveLength(1);
  expect((await catatan(page)).trackAktif).toBe(0);

  // Keterangan itu juga ada di Detail.
  await expect(page.getByRole("region", { name: /Hasil rekaman/ })).toBeVisible();
  await page.getByRole("link", { name: "Riwayat" }).click();
  await page.getByRole("main").getByRole("link").first().click();
  await expect(page.getByRole("heading", { name: "Rapat panitia", level: 1 })).toBeVisible();
  // Beranda tetap terpasang tersembunyi, jadi hanya yang terlihat yang dihitung.
  await expect(
    page.getByText("Rekaman dihentikan di batas 10 menit.").filter({ visible: true }),
  ).toHaveCount(1);
});

for (const [nama, galatDom, pesan, keterangan] of [
  [
    "izin mikrofon ditolak",
    "NotAllowedError",
    "Izin mikrofon ditolak.",
    "Izinkan mikrofon di pengaturan browser, lalu coba lagi.",
  ],
  [
    "tidak ada mikrofon",
    "NotFoundError",
    "Mikrofon tidak ditemukan.",
    "Sambungkan mikrofon, lalu coba lagi.",
  ],
] as const) {
  test(`${nama}: pesan jelas, Coba lagi, dan Batal`, async ({ page }) => {
    await page.addInitScript((namaGalat) => {
      let ditolak = true;
      Object.assign(window, { __izinkan: () => (ditolak = false) });
      const asli = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = (batasan) =>
        ditolak ? Promise.reject(new DOMException("", namaGalat)) : asli(batasan);
    }, galatDom);
    await page.goto("/");
    await page.getByRole("button", { name: "Mulai rekam" }).click();

    const peringatan = perekam(page).getByRole("alert");
    await expect(peringatan).toContainText(pesan);
    await expect(peringatan).toContainText(keterangan);
    await expect(perekam(page).getByRole("button", { name: "Selesai" })).toHaveCount(0);
    await page.screenshot({
      path: `e2e/screenshot/mobile/galat-${nama.replaceAll(" ", "-")}.png`,
    });

    // Setelah masalahnya diperbaiki, Coba lagi langsung merekam.
    await page.evaluate(() => (window as unknown as { __izinkan: () => void }).__izinkan());
    await perekam(page).getByRole("button", { name: "Coba lagi" }).click();
    await expect(perekam(page).getByText("Merekam", { exact: true })).toBeVisible();

    await perekam(page).getByRole("button", { name: "Batal" }).click();
    await expect(perekam(page)).toBeHidden();
  });
}

test("browser tanpa dukungan perekaman (mis. dibuka lewat HTTP di HP)", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Mulai rekam" }).click();
  await expect(perekam(page).getByRole("alert")).toContainText("Browser ini tidak bisa merekam.");
  await expect(perekam(page).getByRole("alert")).toContainText(
    "Buka lewat HTTPS atau pakai browser lain.",
  );
  await perekam(page).getByRole("button", { name: "Batal" }).click();
  await expect(perekam(page)).toBeHidden();
});

test("penyimpanan penuh: rekaman ditahan dan bisa disimpan ulang", async ({ page }) => {
  // Tiru penyimpanan penuh: penulisan ke tabel audio ditolak sampai "ruang dikosongkan".
  await page.addInitScript(() => {
    let penuh = true;
    Object.assign(window, { __kosongkanRuang: () => (penuh = false) });
    const asli = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (this: IDBObjectStore, ...argumen) {
      if (penuh && this.name === "audio") {
        throw new DOMException("Penyimpanan penuh", "QuotaExceededError");
      }
      return asli.apply(this, argumen);
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Mulai rekam" }).click();
  await expect(perekam(page).getByText("Merekam", { exact: true })).toBeVisible();
  await page.waitForTimeout(1200);
  await perekam(page).getByRole("button", { name: "Selesai" }).click();

  const peringatan = page.getByRole("alert").filter({ hasText: "Rekaman belum tersimpan." });
  await expect(peringatan).toBeVisible();
  await expect(peringatan).toContainText("Penyimpanan penuh.");
  await page.screenshot({ path: "e2e/screenshot/mobile/galat-penyimpanan-penuh.png" });
  // Transaksi dibatalkan utuh: tidak ada rekaman tanpa audio.
  expect(await bacaTabel(page, "rekaman")).toHaveLength(0);

  await page.evaluate(() =>
    (window as unknown as { __kosongkanRuang: () => void }).__kosongkanRuang(),
  );
  await page.getByRole("button", { name: "Coba lagi" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Merangkum" })).toBeVisible();
  expect(await bacaTabel(page, "rekaman")).toHaveLength(1);
  expect(await bacaTabel(page, "audio")).toHaveLength(1);
});
