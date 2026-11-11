# Voice-to-Todo

Rekam suara (maksimum 10 menit), lalu dapatkan ringkasan, poin penting, dan daftar to-do
berkategori dan bertenggat. Web app untuk HP, berbahasa Indonesia, tanpa login: semua data
tersimpan di perangkat (IndexedDB).

Desain: Figma `BLFoqH9YkGHWzOL1sUxTUT`, frame mobile. Hal yang tidak ada di desain dicatat di
[docs/design-gaps.md](docs/design-gaps.md).

## Menjalankan

```bash
npm install
npm run dev          # http://localhost:3000
npm run dev:https    # https, untuk mencoba mikrofon dari HP di jaringan yang sama
```

Mikrofon hanya bekerja di `localhost` atau HTTPS. Dari HP, jalankan `npm run dev:https` lalu buka
`https://<IP-laptop>:3000` dan terima peringatan sertifikat.

Halaman bantu saat pengembangan (tidak ada di build produksi untuk `/dev/data`):

- `/dev/components`: semua komponen dan variannya.
- `/dev/data`: isi IndexedDB dengan data contoh dari Figma, kosongkan data, atur kartu sesi di Beranda.

## Konfigurasi AI

Salin `.env.example` ke `.env.local`. Kunci hanya dibaca di server dan tidak pernah dikirim ke browser.

| Variabel | Nilai | Keterangan |
|---|---|---|
| `SUMMARY_PROVIDER` | `mock` atau `claude` | Bawaan: `mock` saat pengembangan, `claude` di produksi |
| `SUMMARY_MODEL` | `claude-haiku-5-5` | Model ringkasan |
| `ANTHROPIC_API_KEY` | | Wajib bila `claude` |
| `TRANSCRIBE_PROVIDER` | `mock`, `openai`, `groq` | Bawaan `mock` |
| `TRANSCRIBE_API_KEY` | | Wajib bila `openai` atau `groq` |

Dengan penyedia `mock`, audio diabaikan dan hasilnya selalu contoh "Rapat panitia". Di produksi,
penyedia tiruan ditolak (HTTP 503) kecuali `ALLOW_MOCK_AI=1`.

Status: panggilan ke Claude API dan ke penyedia transkripsi asli **belum pernah dijalankan**;
keduanya baru diuji dengan klien tiruan.

## Cara kerja

1. **Rekam**: `MediaRecorder` (WebM/Opus, fallback MP4 untuk Safari), berhenti otomatis di 10 menit.
2. **Simpan**: rekaman dan audionya ditulis ke IndexedDB dalam satu transaksi, sebelum diproses.
3. **Proses**: audio dikirim ke `POST /api/process`, yang mentranskripsi lalu merangkum dengan
   Claude (structured outputs, divalidasi zod, dicoba ulang sekali). Server tidak menyimpan apa pun
   dan tidak mencatat isi transkrip.
4. **Hasil**: judul, kategori, ringkasan, poin penting, to-do, dan transkrip disimpan di perangkat.
   Tenggat seperti "Jumat" atau "besok" diubah menjadi tanggal absolut berdasarkan tanggal rekaman
   (zona Asia/Jakarta) dan ditampilkan relatif.
5. **Gagal**: rekaman tetap tersimpan; "Coba lagi" memproses ulang dari audio yang sama.

## Struktur

```
app/                 halaman (/, /riwayat, /riwayat/[id]) dan api/process
components/ui/       komponen dari frame Komponen di Figma
components/fitur/    layar: Beranda, Perekam, Riwayat, DetailRekaman
lib/                 IndexedDB (db, repo), perekaman, format waktu, pemrosesan sisi klien
server/              transkripsi, ringkasan, validasi permintaan, pembatas permintaan
e2e/                 test Playwright (390x844) dan tangkapan layar
docs/design-gaps.md  celah desain dan keputusan yang diambil
```

## Pemeriksaan

```bash
npm run lint
npm run typecheck
npm test             # Vitest
npm run e2e          # Playwright; memakai dev server yang berjalan di port 3000
```

Test Playwright memakai mikrofon palsu Chromium dan mencakup audit aksesibilitas (axe, WCAG 2.2 AA).

## Privasi

Suara dan transkrip dikirim ke penyedia pihak ketiga untuk diproses (setelah penyedia asli dipasang).
Tidak ada akun dan tidak ada sinkronisasi: data hanya ada di perangkat tempat rekaman dibuat, dan
hilang bila data situs di browser dihapus.
