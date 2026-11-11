import { expect, test, type Page } from "@playwright/test";

/**
 * Pipeline pemrosesan dari sisi browser: apa yang dikirim ke /api/process dan
 * bagaimana kegagalan ditampilkan. Server memakai penyedia tiruan.
 */
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-10T15:00:00+07:00") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setExtraHTTPHeaders({
    "x-forwarded-for": `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
  });
});

const perekam = (page: Page) => page.getByRole("dialog", { name: "Rekaman baru" });

async function rekamSebentar(page: Page) {
  await page.getByRole("button", { name: "Mulai rekam" }).click();
  await expect(perekam(page).getByText("Merekam", { exact: true })).toBeVisible();
  await page.waitForTimeout(1200);
  await perekam(page).getByRole("button", { name: "Selesai" }).click();
  await expect(perekam(page)).toBeHidden();
}

const kartuGagal = (page: Page) =>
  page.getByRole("alert").filter({ hasText: "Gagal memproses. Rekamanmu aman tersimpan." });
const hasil = (page: Page) => page.getByRole("region", { name: /Hasil rekaman/ });

test("mengirim audio tersimpan, tanggal rekaman, dan durasi ke /api/process", async ({ page }) => {
  // Catat isi formulir yang dikirim aplikasi (Playwright tidak membaca badan multipart berisi berkas).
  await page.addInitScript(() => {
    const asli = window.fetch.bind(window);
    window.fetch = async (masukan, opsi) => {
      if (String(masukan).endsWith("/api/process") && opsi?.body instanceof FormData) {
        const audio = opsi.body.get("audio") as File;
        Object.assign(window, {
          __terkirim: {
            kunci: [...opsi.body.keys()].sort(),
            nama: audio.name,
            tipe: audio.type,
            ukuran: audio.size,
            direkamPada: Number(opsi.body.get("direkamPada")),
            durasiMs: Number(opsi.body.get("durasiMs")),
          },
        });
      }
      return asli(masukan, opsi);
    };
  });
  await page.goto("/");
  const permintaan = page.waitForRequest("**/api/process");
  await rekamSebentar(page);

  const terkirim = await permintaan;
  expect(terkirim.method()).toBe("POST");
  expect(terkirim.headers()["content-type"]).toMatch(/^multipart\/form-data/);
  const formulir = await page.evaluate(
    () => (window as unknown as { __terkirim: Record<string, unknown> }).__terkirim,
  );
  // Hanya tiga isian: tidak ada data lain yang ikut terkirim.
  expect(formulir.kunci).toEqual(["audio", "direkamPada", "durasiMs"]);
  expect(formulir.nama).toBe("rekaman.webm");
  expect(formulir.tipe).toMatch(/^audio\/webm/);
  expect(formulir.ukuran as number).toBeGreaterThan(500);
  expect(formulir.direkamPada).toBeGreaterThan(Date.parse("2026-11-10T00:00:00Z"));
  expect(formulir.durasiMs as number).toBeGreaterThan(1000);

  const respons = await terkirim.response();
  expect(respons?.status()).toBe(200);
  expect(Object.keys(await respons!.json()).sort()).toEqual(
    ["judul", "kategori", "poin", "ringkasan", "transkrip", "tugas"].sort(),
  );
  await expect(hasil(page)).toBeVisible();

  // Transkrip dari server tersimpan dan tampil di Detail.
  await hasil(page).getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Transkrip lengkap" }).click();
  await expect(page.getByRole("region", { name: "Transkrip lengkap" })).toContainText(
    "Proposal sponsor harus sudah dikirim",
  );
});

test("offline saat memproses: gagal dengan keterangan, lalu Coba lagi dari audio tersimpan", async ({
  page,
  context,
}) => {
  await page.goto("/");
  let panggilan = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/process")) panggilan += 1;
  });

  await page.waitForLoadState("networkidle");
  await context.setOffline(true);
  await rekamSebentar(page);
  await expect(kartuGagal(page)).toBeVisible();
  await expect(kartuGagal(page)).toContainText("Tidak ada koneksi internet.");
  // Ikon peringatan sudah dimuat sebelumnya, jadi tetap tampil tanpa jaringan.
  await expect
    .poll(() =>
      kartuGagal(page)
        .locator("img")
        .evaluate((gambar: HTMLImageElement) => gambar.complete && gambar.naturalWidth),
    )
    .toBe(24);
  await page.screenshot({ path: "e2e/screenshot/mobile/galat-offline.png" });
  // Tidak ada permintaan yang dikirim selama offline.
  expect(panggilan).toBe(0);

  await context.setOffline(false);
  await page.getByRole("button", { name: "Coba lagi" }).click();
  await expect(hasil(page)).toBeVisible();
  expect(panggilan).toBe(1);
  // Tidak merekam ulang: perekam tidak dibuka, rekamannya tetap satu.
  await expect(perekam(page)).toBeHidden();
  await page.getByRole("link", { name: "Riwayat" }).click();
  await expect(page.getByRole("main").getByRole("link")).toHaveCount(1);
});

test("server gagal: status Gagal, bertahan setelah reload, Coba lagi berhasil", async ({ page }) => {
  await page.goto("/");
  await page.route("**/api/process", (rute) =>
    rute.fulfill({ status: 502, json: { galat: "ringkasan-gagal" } }),
  );
  await rekamSebentar(page);
  await expect(kartuGagal(page)).toBeVisible();

  await page.unroute("**/api/process");
  await page.goto("/riwayat");
  const kartu = page.getByRole("main").getByRole("link").first();
  await expect(kartu).toContainText("Gagal");
  await expect(kartu).toContainText("Rekaman baru");
  await expect(kartu).toContainText("Rekamanmu aman tersimpan.");

  await kartu.click();
  await page.getByRole("button", { name: "Coba lagi" }).click();
  await expect(hasil(page)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rapat panitia", level: 1 })).toBeVisible();
});

test("terlalu banyak permintaan: keterangan yang sesuai", async ({ page }) => {
  await page.goto("/");
  await page.route("**/api/process", (rute) =>
    rute.fulfill({
      status: 429,
      headers: { "Retry-After": "60" },
      json: { galat: "terlalu-sering" },
    }),
  );
  await rekamSebentar(page);
  await expect(kartuGagal(page)).toContainText("Terlalu banyak permintaan.");
});

test("jawaban server yang tidak sesuai skema ditolak, bukan disimpan", async ({ page }) => {
  await page.goto("/");
  await page.route("**/api/process", (rute) =>
    rute.fulfill({
      status: 200,
      json: { judul: "Tanpa isi", kategori: "Lainnya", tugas: "bukan daftar" },
    }),
  );
  await rekamSebentar(page);
  await expect(kartuGagal(page)).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
});

test("/api/process menolak permintaan yang tidak sah", async ({ request }) => {
  const ip = { "x-forwarded-for": `10.9.${Math.floor(Math.random() * 250)}.1` };
  const kirim = (multipart: Record<string, unknown>) =>
    request.post("/api/process", { headers: ip, multipart: multipart as never });
  const audio = (mimeType: string, ukuran = 1024) => ({
    name: "rekaman.webm",
    mimeType,
    buffer: Buffer.alloc(ukuran),
  });
  const dasar = { direkamPada: String(Date.now()), durasiMs: "60000" };

  const tanpaAudio = await kirim(dasar);
  expect(tanpaAudio.status()).toBe(400);

  const bukanAudio = await kirim({ ...dasar, audio: audio("application/pdf") });
  expect(bukanAudio.status()).toBe(415);
  expect(await bukanAudio.json()).toEqual({ galat: "tipe-tidak-didukung" });

  const terlaluPanjang = await kirim({ ...dasar, durasiMs: "900000", audio: audio("audio/webm") });
  expect(terlaluPanjang.status()).toBe(422);

  const terlaluBesar = await kirim({ ...dasar, audio: audio("audio/webm", 9 * 1024 * 1024) });
  expect(terlaluBesar.status()).toBe(413);

  const sah = await kirim({ ...dasar, audio: audio("audio/webm") });
  expect(sah.status()).toBe(200);
  expect((await sah.json()).judul).toBe("Rapat panitia");

  expect((await request.get("/api/process")).status()).toBe(405);
});

test("/api/process membatasi permintaan beruntun dari satu alamat", async ({ request }) => {
  const ip = { "x-forwarded-for": `10.8.${Math.floor(Math.random() * 250)}.7` };
  const status: number[] = [];
  for (let i = 0; i < 12; i++) {
    // Permintaan tidak sah pun dihitung, supaya penolakan murah tidak bisa dipakai membanjiri.
    const respons = await request.post("/api/process", {
      headers: ip,
      multipart: { direkamPada: "0", durasiMs: "0" },
    });
    status.push(respons.status());
  }
  expect(status.slice(0, 10).every((s) => s === 400)).toBe(true);
  expect(status.slice(10)).toEqual([429, 429]);
});
