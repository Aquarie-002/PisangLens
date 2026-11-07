# AGENTS.md — PisangLens

## Tujuan proyek

Membangun PisangLens, Progressive Web App identifikasi awal empat kondisi daun pisang (Healthy, Pestalotiopsis Leaf Blight, Sigatoka, Cordana Leaf Spot) dengan MobileNet lokal. Petani dapat memindai daun setelah status **Siap luring**, melihat Panduan Tindak Lanjut berdasarkan aturan tervalidasi, serta mengirim konsultasi saat keyakinan model < 0,8. Botani terverifikasi mengambil tiket dan membalas pesan terenkripsi di klien; admin memverifikasi akun botani serta, pada tahap Should, mengkurasi kandidat data latih. Sistem memakai AES-GCM dengan kunci di server (bukan E2EE).

## Dokumen rujukan

- Baca `PRD-PisangLens.md` **v0.3** sebelum mengerjakan tugas. Dokumen ini adalah acuan fitur/prioritas, kontrak API (bagian 12), model data (bagian 11), kontrak model (Lampiran A), tabel calon aturan (Lampiran B), dan checklist uji (Lampiran C).
- Instruksi terbaru yang **secara eksplisit disetujui Alphera** merupakan keputusan untuk memperbarui PRD/AGENTS bila diperlukan. Bila muncul konflik nyata yang belum terselesaikan dan mengubah cakupan, keamanan, kontrak data, atau dependensi, minta keputusan. Ambiguitas kecil yang dapat dibalik diselesaikan dengan pilihan paling sederhana dan asumsi dilaporkan.
- Draf PDF Gemini (v0.1) dan catatan historisnya menjelaskan alasan rancangan; aturan pelaksanaan aktif berada dalam PRD v0.3 dan AGENTS ini. Status `DRAFT`, `[konfirmasi]`, dan `[isi]` berarti **belum ada bukti/keputusan nyata**, bukan izin mengarang nilainya.

## Stack dan dependensi yang disetujui

- Bahasa: PHP (kompatibel **PHP 8.3**, hindari fitur 8.4+), JavaScript ES6+, HTML5, SQL.
- Database: MySQL (server) dan IndexedDB (peramban).
- Frontend: Vanilla JavaScript, CSS statis `public/css/app.css` dari Tailwind CSS, TensorFlow.js versi tetap di `public/vendor/`, serta **Web Crypto API bawaan browser** untuk AES-GCM. **Tidak ada bundler, framework frontend, atau CryptoJS.**
- Pustaka yang diperlukan untuk mode luring diambil dari berkas lokal; runtime AI berada di `public/vendor/` dan CSS yang sudah disiapkan berada di `public/css/app.css`. Tidak mengandalkan CDN saat aplikasi dijalankan.
- Dependensi di luar daftar ini dilarang tanpa bertanya dulu kepada pengguna. Jalankan `composer install` hanya jika sudah disetujui.

## Struktur folder (datar, tanpa MVC)

```
pisanglens/
├─ AGENTS.md, PRD-PisangLens.md, CHANGELOG.md, .gitignore
├─ sql/            schema.sql, seed.sql (admin awal; rahasia/kredensial nyata tidak disimpan di Git)
├─ config/         config.example.php   (config.php di-ignore)
├─ lib/            db.php, auth.php, response.php, crypto.php  (di luar webroot)
├─ storage/        uploads/             (di luar webroot, di-ignore)
└─ public/         (webroot)
   ├─ index.html (masuk/daftar), petani-*.html, botani-*.html, admin-*.html
   ├─ manifest.webmanifest, sw.js (wajib di akar public), icons/
   ├─ css/app.css
   ├─ js/          config.js, api.js, auth.js, db.js, camera.js,
   │               predict.js, triage.js, crypto.js, sync.js, ui.js
   ├─ vendor/      tf.min.js (versi disepakati dan disimpan lokal)
   ├─ models/banana/  model.json, *.bin, labels.json
   └─ api/         auth/, consultations/ (termasuk claim.php dan key.php),
                   botanist/, admin/, history/, scans/, dictionary.php,
                   predict.php (Should)   (file .php dipanggil langsung)
```

## Cara menjalankan

- Laragon: letakkan proyek di `D:\laragon\www\pisanglens`, aktifkan Apache dan MySQL, impor `sql/schema.sql` dan `sql/seed.sql`, serta isi `config/config.php` dari contoh tanpa memasukkan rahasia ke Git. Alternatif server web lokal: `php -S localhost:8000 -t public` (MySQL tetap harus dijalankan terpisah).
- Kamera dan service worker hanya jalan di `localhost` atau HTTPS. Untuk uji di ponsel, gunakan tunnel HTTPS (mis. Cloudflare Tunnel). IP LAN tanpa HTTPS memblokir kamera.
- Di EC2, cek `php -v` dan `mysql --version` sebelum deploy. Pastikan HTTPS aktif sebelum menguji kamera.

## Urutan kerja dan checkpoint

0. **Fase 0 — Periksa hambatan lingkungan sejak awal.** Cek PHP 8.3, MySQL, halaman minimal melalui HTTPS/tunnel, dan izin kamera di ponsel asli. Tetapkan PIC dan jam untuk HTTPS serta penyerahan model. Proses ini dapat dilakukan paralel dengan pekerjaan UI selama dependensinya terjaga. Checkpoint/PIC: `[isi berdasarkan pembagian kerja tim]`.
1. **Fase 1 — Prototipe integrasi tiga peran dengan mock.** Buat alur Petani, Botani, dan Admin memakai `predict()` tiruan (`USE_MOCK_PREDICTION = true` di `config.js`); beri label **Simulasi prediksi**. Uji skenario tetap untuk sehat, penyakit, keyakinan rendah, dan gagal. Kerjakan kamera, ambang, kamus, riwayat terisolasi per akun, status offline, Panduan Tindak Lanjut fallback, dan alur konsultasi. `api.js` dapat memakai respons tiruan yang jelas ditandai selama backend belum siap. Checkpoint: `[isi jam]`.
2. **Fase 2 — Backend nyata.** Autentikasi, RBAC dan kepemilikan objek pada server, sinkronisasi idempoten/parsial, urutan **create → key → encrypt → send**, pengambilan tiket atomik oleh botani, serta verifikasi akun botani oleh admin. Koreksi label/kurasi dataset dikerjakan bila ruang lingkup Should tercapai. Checkpoint: `[isi jam]`.
3. **Fase 3 — Model asli, uji offline, dan deploy.** Setelah Lampiran A dikonfirmasi, ganti mock dengan model TF.js, bandingkan contoh keluaran dari tim data, uji close/reopen di ponsel mode pesawat, lalu publikasikan di EC2 lewat HTTPS. **Hasil model asli gagal tidak boleh disulap menjadi mock tanpa label.** Checkpoint: `[isi jam]`.

Batas keras: koding berhenti **15.30 WIB**, pengumpulan **16.30 WIB**, dan demo alur Must ditargetkan lolos sebelum **15.00 WIB**. Jika waktu mepet, utamakan fitur Must PRD bagian 5 dan catat butir Should yang ditunda. Jangan menganggap model API atau mock memenuhi kriteria deteksi luring.

## Konvensi

- Nama file dan folder: huruf kecil dengan tanda hubung (mis. `petani-kamera.html`, `sync.js`).
- Kode (nama variabel, fungsi, komentar): bahasa Inggris. Teks antarmuka: Bahasa Indonesia.
- Fungsi modular. Semua pemanggilan database dan API eksternal dibungkus penanganan galat. Pisahkan logika tampilan dari pemrosesan data.
- Commit message: awalan `feat`, `fix`, `docs`, `test`, `refactor`, atau `chore` (mis. `feat: add brightness check`). Commit kecil dan sering.
- Konstanta yang bisa disetel (`MIN_LUMA=40`, `MAX_LUMA=220` sebagai nilai awal uji, ambang keyakinan `0.8`, `USE_MOCK_PREDICTION`) berada di `public/js/config.js`. Bandingkan skor mentah 0–1 dengan ambang sebelum memformat persentase di antarmuka.

## Aturan fitur

- **Panduan Tindak Lanjut:** hanya gunakan baris Lampiran B yang sudah memiliki sumber/peninjau dan status `tervalidasi`; seluruh baris sekarang **DRAFT**. Selama belum tervalidasi atau skor < 0,8, tampilkan fallback pengamatan/foto ulang/konsultasi. Dilarang mengarang angka persentase, tingkat risiko panen, porsi daun aman, atau instruksi pemangkasan.
- **Prediksi:** semua antarmuka memanggil `predict(canvas)` dengan keluaran `{class_name, confidence_score, prediction_source, model_version}`. Skor selalu 0–1. Penanda mock terlihat dan hasil mock tidak masuk kandidat latih. Model asli tidak boleh otomatis diganti mock saat gagal. Jangan menebak urutan label, normalisasi, loader, ataupun contoh keluaran tim data.
- **Warna status:** skor < 0,8 tampil amber dan menimpa warna kelas; Healthy dengan skor tinggi tampil hijau, penyakit dengan skor tinggi cokelat kemerahan. Kata "akurasi" tidak digunakan untuk skor satu prediksi.
- **Persiapan luring:** tampilkan status `belum siap / menyiapkan / siap luring / gagal`. Status siap perlu bukti semua aset penting tersedia dan model asli dapat dimuat lokal. Uji tutup-buka aplikasi pada ponsel mode pesawat sebelum mengklaim deteksi offline selesai.
- **Service worker:** cache-first hanya untuk aset statis publik, model, vendor lokal, dan gambar kamus. **API privat network-only tanpa fallback cache**, terutama auth, token, kunci chat, pesan, admin, dan foto terlindungi; respons sensitif `Cache-Control: no-store`. Cache bernama dan berversi; saat iterasi gunakan "Update on reload" di DevTools. Data pribadi offline berada di IndexedDB, terisolasi per akun.
- **Sinkronisasi:** percobaan saat event `online` atau aplikasi dibuka, tetapi kegagalan API tidak dianggap berhasil hanya karena browser tampak online. Idempoten melalui pasangan `(user_id, client_uuid)` dan konfirmasi per item. Hanya item yang diakui server ditandai `is_synced`; 401 menghentikan sinkronisasi tanpa menghapus antrean. Jangan bergantung pada Background Sync API.
- **Konsultasi:** ikuti urutan `create(scan_id) → key(consultation_id) → encrypt → send`. Tiket satu per scan; pakar terverifikasi mengambil tiket belum ditugaskan melalui `claim.php` secara atomik. Hanya peserta tiket yang melihat detail/kunci/pesan. Status `open → answered → closed` mengikuti kontrak PRD.
- **Kurasi (Should):** botani hanya boleh meninjau tiket yang ditanganinya, boleh memilih `undetermined` atau `unusable`, dan tidak boleh memasukkan foto simulasi ke antrean data latih nyata. Admin meninjau kandidat label valid serta dapat menyetujui/menolak; persetujuan bukan retraining otomatis.

## Checklist keamanan (uji bagian terdampak per tugas, seluruhnya sebelum demo)

1. Validasi file unggahan di server dengan `finfo` (JPG/PNG/WEBP, maks 5 MB), nama file diacak, simpan di `storage/uploads/` dan layani lewat `api/scans/image.php` dengan pemeriksaan akses pemilik/pakar peserta/admin yang berwenang.
2. Periksa autentikasi **dan otorisasi objek** pada setiap endpoint; 401 untuk tidak terautentikasi, 403 untuk peran/objek terlarang. HTML boleh dicache sebagai shell; akses API tidak hanya bergantung pada menu yang disembunyikan.
3. Pesan dienkripsi via Web Crypto API AES-GCM di peramban, IV unik per pesan/kunci, payload berisi `alg`, `key_version`, `iv`, `ciphertext`+tag. Kunci per tiket berasal dari server yang memegang kunci induk; jangan sebut E2EE. Tolak dekripsi yang gagal dan render teks dengan `textContent`, bukan `innerHTML`.
4. Endpoint kunci, auth, chat, foto privat, dan admin **tidak dicache** oleh service worker. Jangan masukkan kunci induk atau kredensial ke file publik.
5. Semua query memakai PDO prepared statement; kata sandi memakai `password_hash` dan `password_verify`. Pastikan query pemindaian, konsultasi, dan kurasi memeriksa pemilik/anggota tiket.
6. Kamera, status siap luring, tutup-buka mode pesawat, dan model asli diuji pada ponsel HTTPS.

## Batasan

- Jangan commit `config/config.php`, `.env`, kunci induk atau kunci tiket AES, atau kredensial database. Sediakan `config.example.php` dan pastikan `.gitignore` memuat `config/config.php`, `.env`, `storage/`.
- Dependensi yang tercantum dalam stack dan versi yang telah disetujui boleh dipakai. Penambahan dependensi di luar daftar tetap membutuhkan keputusan pengguna.
- Ubah hanya file yang relevan dengan tugas saat ini. Jangan refactor besar di luar tugas.
- Jangan mengerjakan fitur Non-tujuan atau Won't di PRD (peta GPS, filter wilayah, deteksi blur langsung, WebSocket, statistik admin, app native).
- Untuk ambiguitas kecil yang reversibel, pilih implementasi sederhana yang konsisten dan laporkan asumsi. Minta keputusan bila ada konflik scope/akses/kontrak teknis penting atau data eksternal belum tersedia; jangan mengisi placeholder tim data/agronomi dengan tebakan.

## Pengujian dan pencatatan

- Belum ada tes otomatis. Setiap perubahan diuji pada area yang terdampak. Pada checkpoint integrasi dan sebelum demo, jalankan checklist menyeluruh Lampiran C PRD (kamera, real-model offline setelah close/reopen, peran/objek, sinkronisasi idempoten/parsial, pesan pertama, claim botani, dan keamanan). Tes yang memerlukan ponsel/server sungguhan tetap berstatus belum diuji sampai dijalankan.
- Catat setiap perubahan di `CHANGELOG.md`, satu baris per perubahan: `YYYY-MM-DD HH:MM | prefix | ringkasan | hasil uji manual`.
- Di akhir tiap tugas, laporkan file yang diubah, langkah uji, dan status tiap uji: **lulus, gagal, atau belum diuji** beserta sebabnya. Jangan mengklaim keberhasilan model/offline dari simulasi.

## Definisi selesai

Kriteria penerimaan untuk fitur Must atau tugas terkait terpenuhi, pengujian yang relevan tercatat (termasuk yang gagal/belum bisa diuji), keamanan bagian terdampak diperiksa, dan `CHANGELOG.md` diperbarui. Sebelum demo, alur Must luring/daring dan checklist keamanan keseluruhan harus lulus pada perangkat/lingkungan yang ditentukan. Kriteria Should hanya menjadi wajib setelah masuk scope tahap berikutnya. Batas koding 15.30 WIB tetap berlaku.
