import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
// Saat dev server berjalan lewat HTTPS: BASE_URL=https://localhost:3000 npm run e2e
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.hasil",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    // Sertifikat dev server HTTPS dibuat lokal.
    ignoreHTTPSErrors: true,
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
  },
  projects: [
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        // Mikrofon palsu: izin diberikan otomatis dan sumber suaranya nada uji.
        launchOptions: {
          args: [
            "--use-fake-device-for-media-stream",
            "--use-fake-ui-for-media-stream",
          ],
        },
      },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    ignoreHTTPSErrors: true,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
