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

Mikrofon hanya bekerja di `localhost` atau HTTPS. Untuk mencoba dari HP di Wi-Fi yang sama, buat
sertifikat lokal yang juga berlaku untuk alamat jaringan laptop (sekali saja, butuh
[mkcert](https://github.com/FiloSottile/mkcert)):

```bash
mkcert -cert-file certificates/lan.pem -key-file certificates/lan-key.pem \
  localhost 127.0.0.1 ::1 "$(scutil --get LocalHostName).local" <IP-laptop>
npm run dev:https
```

Lalu buka `https://<nama-laptop>.local:3000` di HP. Agar Safari di iPhone mempercayai sertifikatnya,
pasang `rootCA.pem` dari `mkcert -CAROOT` di iPhone (jangan pernah membagikan `rootCA-key.pem`).

Halaman bantu saat pengembangan (tidak ada di build produksi untuk `/dev/data`):

- `/dev/components`: semua komponen dan variannya.
- `/dev/data`: isi IndexedDB dengan data contoh dari Figma, kosongkan data, atur kartu sesi di Beranda.

## Konfigurasi AI

Salin `.env.example` ke `.env.local`. Kunci hanya dibaca di server dan tidak pernah dikirim ke browser.

**Pilihan gratis (Groq untuk semuanya):** buat kunci di https://console.groq.com/keys, lalu isi
`.env.local`:

```
GROQ_API_KEY=kunci-anda
TRANSCRIBE_PROVIDER=groq
SUMMARY_PROVIDER=groq
```

Transkripsi memakai `whisper-large-v3`, ringkasan memakai `openai/gpt-oss-120b` dengan JSON ketat.
Tier gratis punya batas pemakaian; bila habis, aplikasi menampilkan "Terlalu banyak permintaan".

| Variabel | Nilai | Keterangan |
|---|---|---|
| `TRANSCRIBE_PROVIDER` | `mock`, `groq`, `openai` | Bawaan `mock` |
| `SUMMARY_PROVIDER` | `mock`, `groq`, `claude` | Bawaan: `mock` saat pengembangan, `claude` di produksi |
| `GROQ_API_KEY` | | Dipakai transkripsi dan ringkasan bila `groq` |
| `ANTHROPIC_API_KEY` | | Wajib bila ringkasan `claude` |
| `TRANSCRIBE_API_KEY` | | Wajib bila transkripsi `openai` |
| `TRANSCRIBE_MODEL`, `SUMMARY_MODEL` | | Opsional, mengganti model bawaan |

Dengan penyedia `mock`, audio diabaikan dan hasilnya selalu contoh "Rapat panitia". Di produksi,
penyedia tiruan ditolak (HTTP 503) kecuali `ALLOW_MOCK_AI=1`.

Status: panggilan ke Groq, Claude API, dan OpenAI **belum pernah dijalankan** terhadap API asli;
semuanya baru diuji dengan klien tiruan.

## Cara kerja

1. **Rekam**: `MediaRecorder` (WebM/Opus, fallback MP4 untuk Safari), berhenti otomatis di 10 menit.
2. **Simpan**: rekaman dan audionya ditulis ke IndexedDB dalam satu transaksi, sebelum diproses.
3. **Proses**: audio dikirim ke `POST /api/process`, yang mentranskripsi lalu merangkum dengan
   Groq atau Claude (JSON sesuai skema, divalidasi zod, dicoba ulang sekali). Server tidak menyimpan apa pun
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
