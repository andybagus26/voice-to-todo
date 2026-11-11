# Celah desain

Hal-hal yang dibutuhkan aplikasi tetapi tidak ada (atau tidak konsisten) di Figma
`BLFoqH9YkGHWzOL1sUxTUT`. Semuanya dibuat sederhana dengan komponen dan gaya yang sudah ada.
Aplikasi ini hanya versi web untuk HP; frame desktop dipakai sebagai rujukan perilaku saja.

Status: **diputuskan** berarti sudah dibangun dengan pilihan di bawah dan bisa dikoreksi;
**terbuka** berarti masih menunggu keputusan.

## Fitur tanpa frame mobile

| # | Celah | Yang dibangun | Status |
|---|---|---|---|
| 1 | Detail mobile (2:10) tidak punya edit dan hapus per to-do; tombol "Edit" langsung membuka form untuk satu tugas (2:1513), padahal rekaman bisa punya banyak to-do. | Tombol "Edit" menyalakan mode edit: tiap to-do mendapat ikon edit dan hapus (48px, ikon dari frame desktop 2:1033 dan 2:1036). Ikon edit membuka kartu "Edit to-do" persis seperti 2:1556. | diputuskan |
| 2 | Tambah to-do hanya ada di desktop (2:1859). | Dalam mode edit muncul baris "Tambah to-do" (gaya dari 2:1049). Formnya memakai kartu yang sama dengan edit, berjudul "Tambah to-do". | diputuskan |
| 3 | Hapus rekaman hanya ada di desktop (2:1014). | Tombol teks merah "Hapus rekaman" di bawah kartu Detail, membuka dialog 2:182. | diputuskan |
| 4 | Isi transkrip terbuka hanya ada di desktop (2:1430). | Accordion mobile memakai isi dan warna teks yang sama. | diputuskan |
| 5 | Dialog hapus hanya ada versi 440px. | Lebar layar dikurangi 32px, maksimum 440px. | diputuskan |

## Data yang tidak mungkin sesuai Figma

| # | Celah | Yang dibangun | Status |
|---|---|---|---|
| 6 | Baris "Memproses" dan "Gagal" di Riwayat (2:600, 2:618) sudah berjudul dan berkategori, padahal keduanya baru ada setelah AI selesai. | Rekaman tanpa judul tampil sebagai "Rekaman baru" tanpa chip kategori. Data contoh fase (b) masih mengikuti Figma. | diputuskan |
| 7 | Kartu Riwayat menampilkan ringkasan versi pendek ("Kekurangan dana dan tugas sponsor.") yang berbeda dari ringkasan di Detail. Skema AI hanya punya satu ringkasan. | Ringkasan yang sama, dipotong satu baris dengan elipsis. | terbuka |
| 8 | Di Beranda (2:238) ada to-do dari rekaman "Ide aplikasi" yang di Riwayat berstatus Gagal. | Diikuti hanya di data contoh. Pada data nyata rekaman gagal tidak punya to-do. | diputuskan |
| 9 | Frame "Detail kuliah" (2:2062) berjudul "Rapat panitia". | Judul, tanggal, dan durasi diambil dari rekaman ("Kuliah manajemen", 9 Nov 2026 · 09.00 · 8:32). | diputuskan |

## Teks dan tampilan kecil

| # | Celah | Yang dibangun | Status |
|---|---|---|---|
| 10 | Tab "Selesai" tanpa isi tidak didesain. | Ilustrasi yang sama dengan teks "Belum ada to-do yang selesai". | terbuka (teks baru) |
| 11 | Riwayat tanpa rekaman tidak didesain. | Teks "Belum ada rekaman." | terbuka (teks baru) |
| 12 | Rekaman tidak ditemukan (alamat salah atau sudah dihapus) tidak didesain. | Judul "Rekaman tidak ditemukan" dengan tautan kembali. | terbuka (teks baru) |
| 13 | Tidak ada umpan balik setelah Salin. | Pesan "Disalin" hanya untuk pembaca layar (aria-live), tanpa tampilan baru. | terbuka |
| 14 | Chip Kuliah di kartu to-do selebar 60px (teks terpotong), di komponen 68px. | Lebar chip mengikuti isi. | diputuskan |
| 15 | Panah transkrip di mobile berupa karakter "⌄", di desktop berupa ikon. | Ikon, berputar saat terbuka. | diputuskan |
| 16 | Tenggat yang sudah lewat tidak didesain. | Ditampilkan sebagai tanggal biasa ("8 Nov"), tanpa gaya baru. | diputuskan |
| 17 | Tenggat 7 hari atau lebih tidak didesain. | Tanggal pendek ("21 Nov"); nama hari hanya untuk 2 sampai 6 hari ke depan agar tidak rancu. | diputuskan |
| 18 | Jarak kartu ke "Transkrip lengkap" di 2:10 tetap di y=504, tidak mengikuti tinggi kartu. | Jarak tetap 16px di bawah kartu. | diputuskan |
| 19 | Di layar lebih lebar dari HP tidak ada desain. | Kolom dipusatkan, lebar maksimum 430px. | diputuskan |

## Perilaku yang diasumsikan

| # | Pertanyaan | Yang dibangun | Status |
|---|---|---|---|
| 20 | Kapan kartu "Hasil terbaru" (Memproses, Hasil, Gagal) tampil di Beranda? | Hanya untuk rekaman yang dibuat di sesi ini, di tab "Belum". Hilang setelah reload atau saat rekaman berikutnya dimulai. Rekamannya sendiri tetap ada di Riwayat. | terbuka |
| 21 | Apa yang terjadi bila aplikasi ditutup saat rekaman masih diproses? | Saat dibuka lagi, rekaman itu ditandai Gagal supaya "Coba lagi" muncul; audionya tetap tersimpan. | diputuskan |
| 22 | To-do yang ditambah manual tidak punya tenggat, dan tenggat tidak bisa diubah. | Tanpa chip tenggat. Form edit hanya mengubah teks, sesuai 2:1556. | diputuskan |

## State perekaman di luar desain

Semua memakai kartu peringatan yang bentuknya sama dengan "Rekaman gagal diproses" (2:165):
ikon peringatan, pesan, keterangan kecil, tombol "Coba lagi". Semua teksnya baru.

| # | State | Yang dibangun | Status |
|---|---|---|---|
| 23 | Menunggu izin mikrofon | Layar perekam dengan teks "Menunggu izin mikrofon..." di tempat indikator "Merekam"; timer 00:00, tombol Selesai nonaktif. | terbuka (teks baru) |
| 24 | Izin mikrofon ditolak | "Izin mikrofon ditolak." / "Izinkan mikrofon di pengaturan browser, lalu coba lagi." dengan Coba lagi dan Batal. | terbuka (teks baru) |
| 25 | Tidak ada mikrofon | "Mikrofon tidak ditemukan." / "Sambungkan mikrofon, lalu coba lagi." | terbuka (teks baru) |
| 26 | Browser tidak bisa merekam (termasuk dibuka lewat HTTP, bukan HTTPS) | "Browser ini tidak bisa merekam." / "Buka lewat HTTPS atau pakai browser lain." | terbuka (teks baru) |
| 27 | Mikrofon dipakai aplikasi lain atau rekaman kosong | "Rekaman tidak bisa dimulai." / "Tutup aplikasi lain yang memakai mikrofon, lalu coba lagi." | terbuka (teks baru) |
| 28 | Rekaman terpotong di batas 10 menit | Perekam berhenti sendiri, rekaman tetap disimpan dan diproses. Teks kecil "Rekaman dihentikan di batas 10 menit." di atas kartu Beranda dan di bawah judul Detail. | terbuka (teks baru) |
| 29 | Penyimpanan penuh atau gagal menyimpan | Rekaman ditahan di memori. Kartu "Rekaman belum tersimpan." dengan keterangan "Penyimpanan penuh. Hapus beberapa rekaman, lalu coba lagi. Jangan tutup halaman ini." dan Coba lagi untuk menyimpan ulang. | terbuka (teks baru) |
| 30 | Tombol Esc saat merekam | Diabaikan; rekaman hanya dibuang lewat tombol Batal. | diputuskan |
| 31 | Gelombang suara | Mengikuti suara mikrofon. Dengan "kurangi gerakan" aktif, atau bila analisis audio tidak tersedia, batang diam pada bentuk Figma. | diputuskan |

## Kegagalan pemrosesan di luar desain

Kartu "Gagal memproses. Rekamanmu aman tersimpan." (2:165) dipakai apa adanya; yang baru hanya
satu baris keterangan kecil di bawahnya sesuai sebab kegagalan.

| # | State | Keterangan yang tampil | Status |
|---|---|---|---|
| 32 | Offline saat memproses | "Tidak ada koneksi internet. Sambungkan, lalu coba lagi." Permintaan tidak dikirim selama offline. | terbuka (teks baru) |
| 33 | Terlalu banyak permintaan (429) | "Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi." | terbuka (teks baru) |
| 34 | Rekaman melebihi 10 menit menurut server | "Rekaman melebihi batas 10 menit." | terbuka (teks baru) |
| 35 | Rekaman tanpa suara (transkrip kosong) | "Tidak ada suara yang terdengar di rekaman ini." | terbuka (teks baru) |
| 36 | Audio tidak ada di perangkat | Pesan diganti "Gagal memproses." / "Audio rekaman ini tidak ada di perangkat.", tanpa tombol Coba lagi, karena "aman tersimpan" tidak benar. | terbuka (teks baru) |
| 37 | Kegagalan server lain | Kartu asli tanpa keterangan tambahan. | diputuskan |

## Penyimpangan dari Figma demi aksesibilitas (WCAG 2.2 AA)

Rasio kontras dihitung dari nilai warna di Figma. Dua tidak memenuhi syarat dan diubah:

| # | Elemen | Di Figma | Yang dibangun | Status |
|---|---|---|---|---|
| 38 | Teks segmen tidak aktif ("Selesai" saat "Belum" terpilih) | `#64748b` di atas `#eef2f6` = 4,23:1 (butuh 4,5:1) | `#475569` (sudah ada di palet, dipakai chip tenggat) = 6,74:1 | diputuskan |
| 39 | Garis kotak centang dan garis isian form saat tidak difokus | `#94a3b8` di atas putih = 2,56:1 (butuh 3:1 untuk batas kontrol) | `#64748b` = 4,76:1 | diputuskan |

Pasangan lain lolos: teks sekunder 4,55:1 dan 4,76:1, aksen 5,6 sampai 6,3:1, chip dan badge
5,25 sampai 7,07:1, "Hapus rekaman" 4,62:1, tugas selesai (64%) 5,35:1, ikon putih di tombol rekam 3,91:1.

Hal lain yang ditambahkan dan tidak terlihat di Figma:

- Garis fokus 2px warna aksen pada semua kontrol saat dinavigasi dengan keyboard.
- Area sentuh segmen diperluas dari 40px menjadi 48px tanpa mengubah tampilannya.
- Fokus kembali ke tombol pemicu setelah dialog hapus atau perekam ditutup.
- Di layar lebih sempit dari 350px, item navigasi bawah dan kolom kartu Riwayat menyempit
  supaya tidak ada gulir mendatar.

## Batasan yang diketahui

- **Penyedia AI.** Claude API tidak punya blok input audio, jadi transkripsi memakai penyedia
  terpisah. Groq (`whisper-large-v3` dan `openai/gpt-oss-120b`) sudah dicoba dengan API asli dan
  berjalan. Adapter Claude (ringkasan) dan OpenAI (transkripsi) baru diuji dengan klien tiruan.
- **Salah dengar transkripsi** ikut terbawa ke ringkasan. Pada uji dengan suara sintesis, "dana"
  terdengar "Dena" dan ringkasan menyebut seolah ada orang bernama Dena.
- **Tier gratis Groq** punya batas permintaan. Bila habis, server membalas 429 dan kartu Gagal
  menampilkan "Terlalu banyak permintaan".
- **Batas 10 menit di server** baru ditegakkan lewat ukuran berkas (8 MB) dan durasi yang dilaporkan
  browser. Penegakan dari durasi audio sebenarnya sudah ada di kode, tetapi baru berlaku setelah ada
  penyedia transkripsi asli yang melaporkan durasi.
- **Pembatas permintaan** (10 per 10 menit per alamat IP) disimpan di memori satu proses. Di hosting
  dengan banyak instance perlu penyimpanan bersama. Alamat IP dibaca dari `x-forwarded-for`, jadi
  server harus berada di belakang proxy yang mengisi header itu.
- **Privasi:** suara dan transkrip dikirim ke penyedia pihak ketiga begitu penyedia asli dipasang.
  Server tidak menyimpan dan tidak mencatat isinya; log hanya memuat kode galat, ukuran, dan durasi.

## Belum diuji di perangkat sungguhan

- Perekaman saat layar terkunci atau tab di latar belakang (iOS bisa menjeda mikrofon).
- Pembaca layar sungguhan (VoiceOver, TalkBack): yang diuji adalah audit axe dan navigasi keyboard.
