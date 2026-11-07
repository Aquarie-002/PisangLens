# PRD: PisangLens (Pisang LEaves Not Sehat) v0.3

## 1. Ringkasan produk

PisangLens adalah Progressive Web App (PWA) pendeteksi penyakit daun pisang berbasis AI yang dirancang untuk dipakai petani di kebun, baik luring maupun daring. Model klasifikasi citra MobileNet berjalan langsung di peramban untuk mengenali empat kondisi daun: **Healthy**, **Pestalotiopsis Leaf Blight**, **Sigatoka**, dan **Cordana Leaf Spot**.

Nilai utama:

- Identifikasi awal kondisi daun tanpa sinyal internet setelah persiapan luring berhasil.
- **Panduan Tindak Lanjut** kualitatif dengan aturan yang sudah divalidasi; selama belum tervalidasi, tampilkan panduan umum dan jalur konsultasi. Ini adalah nama sementara fitur yang semula disebut Kalkulator Triase Dampak Panen.
- Eskalasi konsultasi kepada pakar botani saat skor keyakinan model di bawah 80%, dengan pesan terenkripsi AES-GCM di peramban (server tetap memegang kunci induk; bukan E2EE).
- Riwayat pemindaian lokal dan sinkronisasi ke server, serta antrean kandidat data latih hasil peninjauan botani dan persetujuan admin. Persetujuan belum berarti pelatihan ulang otomatis.

## 2. Masalah dan latar belakang

- **Masalah:** Penyakit jamur dan bercak pada daun pisang merusak kemampuan fotosintesis dan menyusutkan bobot tandan. Petani sering terlambat bertindak karena tidak ada pakar di lapangan dan sinyal internet di kebun lemah.
- **Siapa yang mengalaminya:** Petani pisang yang membutuhkan panduan awal untuk menilai kondisi daun, serta pakar patologi tanaman/botani yang membutuhkan saluran konsultasi jarak jauh yang terstruktur.
- **Bukti/pengamatan:** Dataset [BananaLSD](https://data.mendeley.com/datasets/9tb7k297ff/1) mencakup foto Healthy, Sigatoka, Cordana Leaf Spot, dan Pestalotiopsis Leaf Blight. Model empat kelas merupakan bantuan identifikasi awal; foto di luar cakupan atau dengan kualitas buruk tetap dapat salah diklasifikasikan.

## 3. Tujuan dan non-tujuan

**Tujuan (terukur):**

1. Mengklasifikasikan empat kondisi daun dari foto kamera (224×224 piksel) menggunakan model asli secara luring, dengan waktu inferensi di bawah 3 detik **setelah model siap** pada perangkat uji yang dicatat. Waktu pemuatan model diukur terpisah.
2. Menampilkan peringatan dan rute konsultasi ke botani untuk setiap hasil dengan skor keyakinan model di bawah 0,8 (80%); ambang ini merupakan aturan produk awal, bukan ukuran akurasi.
3. Mendemonstrasikan alur kamera, model asli, riwayat, sinkronisasi, Panduan Tindak Lanjut yang tervalidasi (atau fallback umum bila belum), dan tiket konsultasi pada tiga peran. PWA dapat dibuka ulang dalam mode pesawat setelah status **Siap luring** tercapai.

**Non-tujuan (tidak dikerjakan pada versi ini):**

1. Peta persebaran wabah berbasis GPS dan grafik statistik di halaman admin.
2. Penyaringan daftar botani berdasarkan kecocokan wilayah geografis.
3. Deteksi keburaman gambar langsung pada aliran video sebelum tombol potret ditekan.
4. Paket aplikasi native Android/iOS dan fitur template resep otomatis bagi botani.

## 4. Pengguna

- **Persona 1 (Petani) — Budi:** petani pisang yang butuh identifikasi awal lewat kamera ponsel, panduan dari kamus penyakit, Panduan Tindak Lanjut, dan riwayat yang tetap berfungsi tanpa sinyal.
- **Persona 2 (Botani) — Ratna:** pakar patologi tanaman yang butuh antrean hasil berkeyakinan rendah yang rapi, ruang konsultasi aman, dan opsi untuk mengoreksi atau menyatakan label belum dapat dipastikan.
- **Persona 3 (Admin):** pengelola platform yang memverifikasi kredensial pendaftar botani dan meninjau kandidat data latih hasil koreksi botani.

## 5. Fitur dan prioritas (MoSCoW)

- **Must:**
  - Tangkapan kamera HTML5 dengan validasi kecerahan kanvas.
  - Inferensi empat kelas dengan model asli di peramban secara luring melalui `predict()`; mock digunakan untuk tahap prototipe dan pengujian.
  - Logika ambang keyakinan 80%.
  - Kamus penyakit luring dengan pencarian.
  - Autentikasi tiga peran, verifikasi akun botani oleh admin, dan kontrol akses server atas peran serta objek data.
  - Service worker untuk aset aplikasi, runtime AI, model, dan kamus dengan indikator kesiapan luring.
  - Riwayat pemindaian lokal dan sinkronisasi minimum yang idempoten agar tiket memiliki `scan_id` server.
  - Panduan Tindak Lanjut dari aturan tervalidasi, dengan fallback umum untuk aturan yang masih DRAFT.
  - Konsultasi sederhana: buat tiket, ambil tiket oleh botani, kirim pesan pertama, serta baca dan balas pesan terenkripsi.
- **Should:**
  - Fitur koreksi label dataset oleh botani dan persetujuan/penolakan kandidat oleh admin.
  - API prediksi daring sebagai cadangan bila model lokal belum siap (tidak memenuhi syarat inferensi luring).
- **Could:**
  - Penghapusan otomatis pesan diskusi berusia lebih dari 7 hari.
  - Lencana status sinkronisasi pada daftar riwayat petani.
- **Won't:** peta sebaran penyakit geospasial, pengelompokan wilayah pengguna, analitik angka di panel admin, obrolan langsung berbasis WebSocket.

## 6. User story dan kriteria penerimaan

### US-01: Pemindaian daun dan validasi kualitas foto

Sebagai petani, saya ingin memotret daun pisang dengan pengecekan pencahayaan otomatis, agar memperoleh identifikasi awal meski tanpa sinyal setelah aplikasi siap luring.

- **AC-01:** Diberikan petani di halaman kamera, ketika foto diambil dan rata-rata luminansi piksel kanvas di bawah `MIN_LUMA` atau di atas `MAX_LUMA`, maka sistem menolak pemrosesan AI dan menampilkan panduan memotret ulang.
- **AC-02:** Diberikan pencahayaan memenuhi syarat dan model asli sudah siap luring, ketika gambar diproses sesuai kontrak Lampiran A, maka sistem menampilkan nama kelas, status kondisi, dan persentase keyakinan. Mode mock selalu ditandai sebagai simulasi.

### US-02: Skor keyakinan rendah dan konsultasi botani

Sebagai petani, saya ingin peringatan jelas saat hasil AI meragukan dan bisa menghubungi botani, agar tidak salah merawat tanaman.

- **AC-01:** Diberikan hasil prediksi dengan skor ≥ 0,8, sistem menampilkan **hasil identifikasi awal** dan kelas kondisi daun tanpa peringatan keyakinan rendah. Kelas penyakit tetap ditampilkan sebagai terindikasi penyakit, bukan status "normal".
- **AC-02:** Diberikan hasil prediksi dengan skor < 0,8, sistem menampilkan peringatan **keyakinan model rendah**, tombol potret ulang, dan tombol konsultasi botani (aktif saat API dapat dijangkau dan scan sudah tersinkron).
- **AC-03:** Diberikan scan berskor < 80% yang dibuat saat luring, ketika petani kemudian daring dan membuka daftar Riwayat, maka scan tersebut menampilkan tombol konsultasi yang membuka tiket.

### US-03: Panduan Tindak Lanjut dan sinkronisasi riwayat

Sebagai petani, saya ingin mendapat panduan tindak lanjut sesuai informasi yang tersedia dan menyimpan riwayat, agar bisa memantau perubahan gejala.

- **AC-01:** Setelah petani memilih Fase Tumbuh atau Berbuah, rekomendasi spesifik hanya berasal dari baris Lampiran B yang telah memiliki sumber/peninjau dan status **tervalidasi**, serta ketika skor prediksi ≥ 0,8. Baris DRAFT hanya menghasilkan panduan pengamatan umum dan opsi konsultasi; tidak menampilkan klaim porsi daun aman atau tingkat risiko bobot panen.
- **AC-02:** Scan yang disimpan saat luring tetap ada di IndexedDB. Saat jaringan tersedia dan API dapat dijangkau, sinkronisasi mengirim antrean milik akun aktif; hanya item yang diakui server ditandai tersinkron, sedangkan item gagal tetap antre untuk dicoba ulang.
- **AC-03:** Skor < 0,8 tidak menghasilkan arahan pemangkasan spesifik berdasarkan kelas yang diragukan; petani diarahkan untuk memotret ulang atau berkonsultasi.

### US-04: Tinjauan label botani dan kurasi admin (Should)

Sebagai botani dan admin, saya ingin meninjau kasus meragukan serta mengkurasi label hasil tinjauan, agar tersedia kandidat data latih yang lebih terstruktur.

- **AC-01:** Hanya botani terverifikasi yang telah mengambil tiket dapat memberi label koreksi atau menyatakan **tidak dapat dipastikan/tidak layak digunakan**, disertai catatan dan waktu tinjauan; kandidat berlabel valid masuk antrean admin berstatus `pending`.
- **AC-02:** Admin dapat menyetujui atau menolak kandidat dan mencatat peninjau/keputusan. Hanya kandidat berlabel valid yang disetujui boleh dipakai untuk proses pelatihan terpisah; tidak ada retraining/deployment otomatis pada versi ini.
- **AC-03:** Data bertanda `prediction_source = mock` tidak masuk antrean data latih nyata.

### US-05: Kamus penyakit dan riwayat kesehatan

Sebagai petani, saya ingin membuka kamus penyakit dan riwayat pemeriksaan kapan saja, agar bisa belajar dan memantau tanaman tanpa sinyal.

- **AC-01:** Setelah status **Siap luring** tercapai, keempat entri kamus beserta deskripsi, gejala, mitigasi, dan gambar contoh bisa dibuka serta dicari ketika perangkat offline.
- **AC-02:** Riwayat akun aktif terbaca dari IndexedDB dan tersusun terbaru dahulu, lengkap dengan nama kelas, skor, tanggal, dan status sinkronisasi secara tekstual; lencana khusus tetap Could.
- **AC-03:** Setelah aplikasi ditutup lalu dibuka kembali dalam mode pesawat pada ponsel asli, kamera, model lokal **asli**, kamus, dan riwayat tetap dapat digunakan.

### US-06: Autentikasi dan peran

Sebagai pengguna, saya ingin masuk sesuai peran saya, agar hanya melihat fitur yang menjadi hak saya.

- **AC-01:** Diberikan pendaftaran petani, maka akun langsung aktif. Diberikan pendaftaran botani (dengan nomor lisensi), maka akun berstatus `is_verified = 0` dan tidak dapat mengakses tiket sampai disetujui admin.
- **AC-02:** Setelah login dan persiapan luring selesai, profil akun aktif tersimpan lokal agar kamera, kamus, dan riwayat akun itu dapat dipakai tanpa internet. Token kedaluwarsa tidak menghapus antrean; API meminta login ulang ketika jaringan tersedia.
- **AC-03:** Halaman HTML adalah kerangka antarmuka statis yang boleh di-cache; navigasi pengguna dialihkan sesuai peran di klien. Server mengembalikan 401 bila autentikasi tidak sah dan 403 bila peran atau akses objek tidak diizinkan.
- **AC-04:** Setelah logout atau berganti akun, riwayat dan antrean scan pengguna sebelumnya tidak terlihat atau ikut tersinkron ke akun baru; data belum tersinkron tetap disimpan untuk akun asal.

### US-07: Pembuatan tiket, pengambilan tiket, dan pesan pertama

Sebagai petani, saya ingin membuat tiket dari scan berkeyakinan rendah, kemudian berdiskusi dengan botani terverifikasi yang mengambil kasus saya.

- **AC-01:** Petani yang memiliki scan berkeyakinan < 0,8 dan sudah tersinkron membuat tiket hanya dengan `scan_id`, mendapatkan `consultation_id`, mengambil kunci tiket lewat API terlindungi, mengenkripsi pesan, lalu mengirim pesan pertama; setiap langkah gagal ditangani tanpa duplikasi tiket.
- **AC-02:** Tiket yang belum diambil terlihat sebagai ringkasan pada antrean botani terverifikasi. Hanya satu botani dapat berhasil mengambilnya melalui operasi atomik; pakar lain mendapat respons konflik. Sesudah mengambil tiket, botani mendapat akses detail kasus, kunci, pesan, dan balasan.
- **AC-03:** Akses foto, kunci, dan percakapan hanya diperbolehkan bagi pemilik scan, botani peserta tiket, dan akses foto khusus admin terhadap kandidat antrean kurasi (tanpa akses percakapan).

## 7. Alur pengguna

1. Pengguna membuka tautan HTTPS PisangLens dan memasangnya ke layar utama sebagai PWA.
2. Petani login dan memulai persiapan luring. Aset antarmuka, vendor lokal, kamus, label, serta seluruh berkas model disimpan dan diuji keterbacaannya; indikator berubah menjadi **Siap luring** hanya setelah semuanya berhasil.
3. Petani memotret daun. Kanvas memeriksa luminansi, menyiapkan input 224×224 sesuai ekspor tim data, dan menyimpan versi foto terkompresi (±800 px) untuk riwayat dan tinjauan pakar.
4. Model lokal menghasilkan identifikasi awal, skor keyakinan 0–1, sumber prediksi, dan versi model. Mock ditampilkan sebagai simulasi selama pengujian.
5. Petani memilih fase tanaman pada Panduan Tindak Lanjut; aplikasi menampilkan aturan tervalidasi atau fallback umum, lalu menyimpan riwayat milik akun aktif ke IndexedDB.
6. Saat jaringan tersedia, riwayat disinkronkan secara idempoten. Scan dengan skor < 0,8 yang mendapat `scan_id` server dapat dibuka dari Hasil atau Riwayat untuk membuat tiket.
7. Petani membuat tiket, mengambil kunci untuk `consultation_id`, mengenkripsi dan mengirim pesan pertama. Botani terverifikasi mengambil tiket, mengambil kunci peserta, lalu membaca dan membalas pesan.
8. Secara opsional (Should), botani mengoreksi label atau menandai kasus tidak pasti; admin mengkurasi kandidat. Persetujuan tidak menjalankan pelatihan ulang otomatis.

## 8. Rancangan antarmuka

- **Daftar layar:** Autentikasi (Masuk/Daftar), Beranda Kamera dan Pratinjau Kanvas, Hasil Identifikasi dan Panduan Tindak Lanjut, Kamus Penyakit, Riwayat Kesehatan, Tiket dan Obrolan Botani, Verifikasi Pengguna dan Dataset Admin.
- **Navigasi per peran:**
  - Petani: bilah bawah (Kamera, Kamus, Riwayat, Konsultasi).
  - Botani: bilah bawah (Antrean Tiket, Obrolan, Akun).
  - Admin: dua tab (Verifikasi Botani, Antrean Koreksi Dataset).
- **Gaya:** desain seluler satu kolom, responsif dari lebar 360 px sampai desktop. Status persiapan luring harus terlihat jelas di beranda.
- **Warna status:** hijau zamrud = hasil Healthy dengan skor ≥ 0,8, kuning amber = keyakinan model < 0,8, cokelat kemerahan = terindikasi penyakit dengan skor ≥ 0,8.
- **Prioritas warna:** amber menimpa warna kondisi daun ketika keyakinan rendah. Label kelas dan status keyakinan tetap terbaca terpisah; angka confidence tidak dinyatakan sebagai akurasi model.

## 9. Kebutuhan fungsional

| ID | Kebutuhan |
|----|-----------|
| FR-01 | Foto disiapkan sebagai input 224×224 RGB. Crop/resize, normalisasi, bentuk tensor, dan keluaran harus sama dengan ekspor model yang dikonfirmasi tim data di Lampiran A; agen tidak boleh menebak nilai yang belum tersedia. |
| FR-02 | Sistem menghitung rata-rata kecerahan perkiraan (`0.2126R + 0.7152G + 0.0722B`, skala kanal 0–255) lalu menolak foto di bawah `MIN_LUMA` (nilai awal 40) atau di atas `MAX_LUMA` (nilai awal 220). Nilai ini dapat disetel di `config.js` setelah pengujian dan tidak membuktikan objek adalah daun pisang. |
| FR-03 | Sistem membedakan kelas Healthy/penyakit dari indikator keyakinan model. Skor < 0,8 tampil amber; skor ≥ 0,8 tetap hasil identifikasi awal (aturan bagian 8). |
| FR-04 | Kamus dan gambar referensi tersedia secara lokal setelah persiapan. Scan disimpan di IndexedDB dengan identitas pemilik akun; antrean yang belum tersinkron dikirim ke MySQL ketika API tersedia dan tetap ada selama kegagalan. |
| FR-05 | Pesan dienkripsi di klien dengan Web Crypto API **AES-GCM** dan kunci per tiket yang diturunkan/dikelola server. Payload mencakup `alg`, `key_version`, `iv` unik per pesan/kunci, serta `ciphertext` beserta tag autentikasinya. Kunci hanya diberikan lewat API yang memeriksa pemilik/anggota tiket, setelah `consultation_id` ada. Server memegang kunci induk: **enkripsi sisi klien, bukan E2EE**. Tidak ada kunci dalam kode publik atau cache service worker. |
| FR-06 | HTML statis boleh di-cache sebagai kerangka antarmuka; pengalihan menu di klien untuk pengalaman pengguna. **Setiap endpoint** memeriksa autentikasi, peran, kepemilikan scan, dan keanggotaan tiket di server. Respons 401 untuk autentikasi tidak sah, 403 untuk akses terlarang. |
| FR-07 | Service worker memakai cache-first hanya untuk HTML/CSS/JS publik, pustaka lokal di `public/vendor/`, gambar kamus, dan berkas model/label yang diperiksa versi serta kelengkapannya. Aset model dapat disiapkan terpisah dari shell aplikasi. Semua API privat (auth, token/kunci, gambar terlindungi, chat, admin, penulisan) **network-only**, tanpa fallback Cache API; riwayat luring ditangani IndexedDB. |
| FR-08 | Semua antarmuka memanggil `predict(canvas)` dan menerima `{class_name, confidence_score, prediction_source, model_version}`. `confidence_score` selalu 0–1; `prediction_source` = `mock`, `local`, atau `server`. Mode mock eksplisit dan terlihat di UI. Kegagalan model nyata memunculkan galat, bukan diam-diam beralih ke mock. Implementasi model tetap terpusat di `predict.js`. |
| FR-09 | Setelah login dan persiapan pertama, profil identitas/peran disimpan lokal untuk fitur luring akun aktif. Scan privat dipisahkan per `owner_user_id`. Token kedaluwarsa membuat operasi API berhenti hingga autentikasi ulang, tetapi tidak menghapus scan yang belum tersinkron. Logout atau pergantian akun tidak memperlihatkan maupun mengunggah data akun lain. |
| FR-10 | Sinkronisasi dicoba saat aplikasi dibuka dan peristiwa `online` (indikator jaringan hanya pemicu percobaan, bukan jaminan API terjangkau). `client_uuid` idempoten **dalam cakupan pengguna**; server menetapkan pemilik dari token. Respons mengakui item sukses satu per satu, item gagal tetap antre, 401 meminta login ulang. Tidak bergantung pada Background Sync API. |
| FR-11 | Layar obrolan melakukan polling pesan tiap 5–10 detik selama percakapan terbuka dan pengguna memiliki hak akses. Operasi obrolan hanya tersedia daring. |
| FR-12 | Foto untuk riwayat/sinkronisasi/tinjauan disimpan sebagai JPEG terkompresi maksimum sekitar 800 px; input inferensi 224×224 disiapkan terpisah. Foto terlindungi diambil dengan `fetch` yang mengirim Bearer token, lalu ditampilkan sebagai Blob URL; berkas server berada di luar webroot. |
| FR-13 | Tiket konsultasi dibuka dari Hasil atau Riwayat untuk scan pemilik dengan skor < 0,8 dan `scan_id` server. Alurnya **create(scan_id) → key(consultation_id) → encrypt → send**; pembuatan tiket idempoten untuk satu scan agar gagal jaringan tidak membuat duplikat. |
| FR-14 | **Panduan Tindak Lanjut** menggunakan aturan kualitatif sesuai kelas dan fase hanya jika baris Lampiran B tervalidasi dan skor ≥ 0,8. Selain itu tampil panduan pengamatan umum/foto ulang/konsultasi; tidak mengarang persentase atau arahan pemangkasan. |
| FR-15 | Indikator persiapan luring: `belum siap`, `menyiapkan`, `siap luring`, `gagal`. Status siap hanya setelah aset aplikasi, kamus, runtime, label, dan seluruh model dapat dibaca/dimuat lokal; kegagalan dapat dicoba ulang. |
| FR-16 | Botani terverifikasi mengambil tiket yang belum ditugaskan melalui operasi atomik. Hanya peserta tiket yang boleh mengakses detail kasus, kunci, dan pesan; calon botani lain hanya menerima ringkasan antrean. |
| FR-17 (Should) | Koreksi label mencatat peninjau, waktu, catatan, label awal/koreksi, status tidak pasti/tidak layak, serta keputusan admin. Hanya label valid yang disetujui dan bukan mock menjadi kandidat pelatihan; tidak memicu retraining otomatis. |

## 10. Kebutuhan non-fungsional

- **NFR-01 (performa):** Total bobot model maksimal 15 MB. Waktu inferensi lokal di bawah 3 detik setelah model siap; waktu pemuatan pertama diukur terpisah. Perangkat, versi OS/browser, ukuran model, dan hasil uji diisi berdasarkan pengukuran nyata: `[isi hasil uji]`.
- **NFR-02 (keamanan):**
  - Aplikasi berjalan lewat HTTPS agar izin kamera dan service worker tidak diblokir.
  - Unggahan citra dibatasi JPG/PNG/WEBP maksimal 5 MB, divalidasi di server dengan `finfo` (bukan hanya ekstensi), dan nama file diacak.
  - Kata sandi di-hash dengan `password_hash`.
  - Seluruh query memakai PDO prepared statement. Teks chat ditampilkan dengan `textContent`.
  - Pesan memakai AES-GCM dengan IV unik setiap enkripsi untuk kunci yang sama; kegagalan autentikasi/dekripsi harus ditangani tanpa menampilkan isi palsu.
  - Endpoint auth, kunci, chat, foto privat, dan admin tidak disimpan dalam Cache API; respons sensitif menggunakan `Cache-Control: no-store`.
- **NFR-03 (responsivitas):** Tata letak adaptif dari lebar 360 px sampai monitor desktop.
- **NFR-04 (kompatibilitas):** Target utama Chrome Android. Safari iOS dukungan upaya terbaik (PWA standalone, IndexedDB, dan kamera diuji manual). Kode PHP kompatibel dengan PHP 8.3 (versi bawaan Ubuntu 24.04 di EC2).

## 11. Model data

| Entitas | Lokasi | Atribut utama | Relasi |
|---------|--------|---------------|--------|
| local_scans | IndexedDB | local_id, owner_user_id, client_uuid, image_blob (±800 px), predicted_class, confidence_score (0–1), prediction_source, model_version, triage_phase, created_at, is_synced, server_scan_id | Terisolasi per akun |
| local_dictionary | IndexedDB | class_name, description, symptoms, mitigation, sample_image | Mandiri di klien |
| users | MySQL | id, name, email, password_hash, role (petani/botani/admin), license_number (botani), is_verified, created_at | 1 ke banyak scans |
| auth_tokens | MySQL | id, user_id, token_hash, expires_at | Banyak ke 1 users |
| scans | MySQL | id, user_id, client_uuid (unik bersama user_id), image_path, predicted_class, confidence_score, prediction_source, model_version, triage_phase, created_at, synced_at | Banyak ke 1 users |
| consultations | MySQL | id, scan_id (unik), petani_id, botani_id (null sampai diambil), status (`open`/`answered`/`closed`), created_at | 1 ke banyak chat_messages |
| chat_messages | MySQL | id, consultation_id, sender_id, encrypted_message (payload `alg`/`key_version`/`iv`/`ciphertext`), created_at | Banyak ke 1 consultations |
| retraining_queue (Should) | MySQL | id, scan_id, consultation_id, original_label, corrected_label (nullable), review_outcome (`valid`/`undetermined`/`unusable`), reviewed_by, reviewed_at, review_note, status (`pending`/`approved`/`rejected`), approved_by, decided_at, created_at | 1 ke 1 scans |

Catatan:

- `is_verified` untuk petani default 1. Untuk botani default 0 sampai admin menyetujui. Admin dibuat lewat seed SQL.
- `scans` memiliki batasan `UNIQUE(user_id, client_uuid)` dan `consultations` memiliki `UNIQUE(scan_id)` untuk mencegah duplikasi selama pengiriman ulang.
- `retraining_queue.status` mencatat keputusan admin. `review_outcome = undetermined/unusable` tidak menghasilkan kandidat siap latih.
- Berkas lokal tidak dijanjikan tersimpan permanen ketika browser menghapus data; aplikasi menunjukkan status persiapan dan sinkronisasi. `owner_user_id` mencegah satu akun melihat data milik akun lain dalam satu peramban.
- Persetujuan admin hanya mengkurasi kandidat. Penetapan data latih/uji, augmentasi, dan retraining dilakukan melalui proses tim data terpisah.

## 12. Kontrak API

Semua jalur memakai file `.php` langsung (tanpa rewrite). Autentikasi memakai header `Authorization: Bearer <token>` kecuali login/register. Respons berbentuk JSON, selain endpoint foto yang mengembalikan berkas. API mengembalikan 401 untuk token tidak sah, 403 untuk akses objek/peran terlarang, serta 409 untuk konflik pengambilan tiket. Semua API privat **network-only** dan respons sensitif menggunakan `Cache-Control: no-store`.

| Metode | Jalur | Request | Response | Peran |
|--------|-------|---------|----------|-------|
| POST | /api/auth/register.php | name, email, password, role (petani/botani), license_number (botani) | status | publik |
| POST | /api/auth/login.php | email, password | token, user_id, role, is_verified, name, expires_at | publik |
| POST | /api/auth/logout.php | kosong | status | semua |
| GET | /api/dictionary.php | kosong | array empat kelas penyakit | semua |
| POST | /api/predict.php (Should) | file gambar 224×224 (multipart) | class_name, confidence_score (0–1), prediction_source = `server`, model_version | petani |
| POST | /api/history/sync.php | array batch kecil: client_uuid, image_base64, predicted_class, confidence_score (0–1), prediction_source, model_version, triage_phase, created_at | synced: [{client_uuid, scan_id}], failed: [{client_uuid, reason}], status | petani |
| GET | /api/scans/image.php?scan_id= | kosong; `fetch` dengan Bearer token | berkas foto terlindungi | pemilik, botani peserta tiket, admin hanya jika scan dalam antrean kurasi |
| POST | /api/consultations/create.php | scan_id **tanpa pesan** | consultation_id, status (idempoten untuk scan yang sama) | petani pemilik scan berskor < 0,8 |
| GET | /api/consultations/list.php | kosong | tiket pemilik, ringkasan tiket terbuka bagi botani, dan detail tiket yang ditugaskan | petani, botani terverifikasi |
| POST | /api/consultations/claim.php | consultation_id | consultation_id, status; 409 jika sudah diambil pakar lain | botani terverifikasi |
| GET | /api/consultations/key.php?consultation_id= | kosong | kunci AES-GCM per tiket dan `key_version` (tanpa cache) | petani pemilik, botani yang sudah mengambil tiket |
| GET | /api/consultations/messages.php?consultation_id=&after_id= | kosong | array pesan terenkripsi | peserta tiket saja |
| POST | /api/consultations/send.php | consultation_id, encrypted_message (`alg`, `key_version`, `iv`, `ciphertext`) | message_id, status | peserta tiket saja |
| POST | /api/botanist/review.php (Should) | scan_id, consultation_id, review_outcome, corrected_label (jika valid), review_note | queue_id, status | botani terverifikasi yang menangani tiket |
| GET | /api/admin/queue.php?type=botanist\|retraining | kosong | daftar item `pending` | admin |
| POST | /api/admin/approve.php | target_id, approval_type (`botanist_license`/`retraining`), decision (`approve`/`reject`) | updated_status | admin |

Catatan:

- `/api/predict.php` bersifat **Should** sebagai cadangan daring dan hanya boleh menggunakan endpoint model sungguhan saat mode nyata; respons mock diizinkan pada mode simulasi dengan penanda eksplisit. Keberhasilan API tidak memenuhi uji inferensi luring.
- Server menentukan `user_id` dari Bearer token, tidak mempercayai identitas pemilik dari body. Pemetaan `client_uuid` ke `scan_id` dikirim per item; item gagal, termasuk kegagalan sebagian batch, tetap antre di klien. Jika server merespons 401, sinkronisasi berhenti hingga login akun yang sama diperbarui.
- Pembuatan tiket memeriksa bahwa scan adalah milik pengirim, sudah ada di server, dan memiliki confidence < 0,8; satu scan memiliki paling banyak satu tiket. Tiket boleh dibuat tanpa pesan pertama untuk memutus ketergantungan antara ID tiket dan kunci enkripsi.
- `claim.php` mengisi `botani_id` hanya jika masih null dalam satu operasi basis data atomik. `status = open` berlaku sebelum/sesudah diambil hingga pakar membalas, `answered` setelah balasan, dan `closed` ketika diskusi ditutup sesuai tindakan pengguna yang berhak.
- Server memeriksa setiap permintaan terhadap kepemilikan `scan_id`, keanggotaan `consultation_id`, dan hubungan scan-tiket. Botani yang belum mengambil tiket hanya menerima ringkasan antrean tanpa foto atau kunci.
- `review_outcome = undetermined/unusable` dicatat sebagai tinjauan tetapi tidak menjadi kandidat berlabel valid yang menunggu persetujuan untuk dilatih. Admin hanya membaca foto yang telah masuk antrean kurasi, bukan seluruh percakapan.

## 13. Teknologi

- **Bahasa dan antarmuka:** HTML5, Vanilla JavaScript, dan CSS statis `public/css/app.css` yang disiapkan dari Tailwind CSS; tidak ada bundler atau compiler CSS yang harus berjalan di peramban. Runtime TensorFlow.js disimpan dengan versi tetap di `public/vendor/`. Enkripsi memakai **Web Crypto API bawaan browser**, tanpa CryptoJS.
- **Backend dan database:** PHP dan MySQL di Laragon (lokal), lalu AWS EC2 Ubuntu 24.04 LTS (3812 MiB RAM, Intel Xeon Platinum 8488C). Kompatibel PHP 8.3.
- **AI dan luring:** TensorFlow.js merupakan pilihan runtime utama; model harus diekspor sesuai Lampiran A dan diuji melalui contoh pembanding. IndexedDB menyimpan data per akun, service worker menyimpan aset publik/model, dan API privat selalu mengambil data terkini dari server.

## 14. Asumsi, batasan, dan risiko

**Prasyarat (blocker):**

- HTTPS publik di atas server AWS (Cloudflare Tunnel atau SSL otomatis), diverifikasi dengan membuka kamera di ponsel asli. Penanggung jawab dan target jam: `[isi]`.
- Untuk uji lokal di ponsel, gunakan tunnel HTTPS. Kamera tidak jalan di alamat IP LAN tanpa HTTPS.
- Artefak model web yang cocok dengan Lampiran A wajib tersedia untuk menyatakan fitur **deteksi luring selesai**. PIC dan waktu penyerahan model: `[konfirmasi tim data]`.
- Rujukan atau peninjau aturan Lampiran B perlu dicatat sebelum satu baris dapat digunakan sebagai rekomendasi khusus. PIC verifikasi: `[isi]`.

**Asumsi:**

- Tim data mengekspor model empat kelas ke format TF.js sesuai Lampiran A; waktu dan rincian preprocessing masih menunggu konfirmasi. API prediksi daring, jika tersedia, hanya cadangan.
- Selama model belum siap, antarmuka dan alur antarperan diuji dengan mock deterministik serta diberi label simulasi. Hasil mock tidak menjadi data latih nyata.

**Batasan:**

- Waktu koding berhenti pukul **15.30 WIB**, pengumpulan akhir pukul **16.30 WIB**.
- Kuota alat bantu asisten koding berbayar terbatas.

**Risiko:**

- Kamera diblokir bila aplikasi dibuka lewat IP mentah tanpa HTTPS.
- Persiapan offline bisa belum lengkap atau penyimpanan peramban dibersihkan sistem (mitigasi: indikator kesiapan, percobaan ulang, dan sinkronisasi saat tersedia jaringan).
- Safari/iOS memiliki keterbatasan dukungan fitur latar belakang; aplikasi tetap menggunakan percobaan sinkronisasi saat `online` dan saat dibuka.
- Model empat kelas tetap dapat memberi label pada foto yang bukan daun pisang, termasuk dengan skor tinggi. Pemeriksaan kecerahan dan ambang 0,8 tidak menjamin identitas objek atau kebenaran prediksi; mitigasi: panduan foto, penyebutan cakupan model, dan jalur verifikasi pakar.
- Kebocoran data evaluasi bila pemisahan data mentah dan augmentasi tidak dijaga tim data.
- Cache service worker lama bisa menampilkan versi usang saat iterasi (gunakan nama cache berversi).
- Status login lokal tidak menjamin token masih berlaku untuk server; API 401 harus menghentikan operasi daring tanpa kehilangan riwayat akun.
- Paket API pribadi, terutama kunci pesan, tidak boleh tersimpan dalam cache service worker.

## 15. Metrik keberhasilan

- **Metrik 1:** Sebelum pukul 15.00 WIB, demo Must berjalan: kamera, model asli, hasil, riwayat/sinkronisasi, Panduan Tindak Lanjut tervalidasi atau fallback yang jujur, login tiga peran, verifikasi botani oleh admin, dan tiket berisi pesan pertama serta balasan botani.
- **Metrik 2:** Setelah indikator **Siap luring**, aplikasi terpasang sebagai PWA, ditutup, dibuka kembali di ponsel mode pesawat, dan menjalankan kamera, model asli, kamus, serta riwayat tanpa internet.
- **Metrik 3:** Pengujian 401/403, pengambilan tiket ganda, sinkronisasi idempoten/sebagian gagal, dan keterbacaan pesan terenkripsi lulus sebelum demo. Ketidaksiapan harus dinyatakan sebagai belum diuji atau gagal.
- **Metrik 4:** Catat hasil waktu inferensi pada perangkat dan browser nyata serta hasil evaluasi tim data yang tersedia, tanpa mengarang target akurasi atau nilai hasil.

## 16. Rencana rilis

- **Prototipe integrasi (mock):** Antarmuka tiga peran diuji di Laragon dengan prediksi tiruan terlabel, meliputi kamera, ambang 0,8, kamus, penyimpanan lokal, panduan fallback, dan alur tiket. Lulus mock tidak berarti fitur AI/luring nyata telah lulus.
- **MVP untuk demo (v1.0):** Integrasikan model asli hasil pelatihan BananaLSD, periksa paket offline, selesaikan alur Must, dan publikasikan ke AWS EC2 lewat HTTPS untuk pengujian juri.
- **Setelahnya:** Otomatisasi pipa pelatihan ulang saat jumlah koreksi label yang disetujui admin mencapai kuota tertentu.

## 17. Riwayat dokumen

| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
| 0.1 | 7 November 2026 | Draf awal arsitektur dan spesifikasi fitur. |
| 0.2 | 7 November 2026 | Revisi menyeluruh: kontrak model, mock prediksi, offline (vendor + service worker), kontrak API dilengkapi, model data diperbarui, US-05/US-06, tabel triase, ambang kecerahan numerik, polling chat, prasyarat HTTPS, klarifikasi enkripsi sisi klien. |
| 0.3 | 7 November 2026 | Penerapan persetujuan R01–R18: prioritas Must, istilah confidence, Panduan Tindak Lanjut tervalidasi, kontrak model/mock, kesiapan offline, isolasi data/sinkronisasi, bootstrap dan claim konsultasi, otorisasi objek, Web Crypto AES-GCM, kurasi label, serta pengujian dan pelaksanaan. |

**Status keputusan:** PRD v0.3 merupakan spesifikasi produk aktif. Draf PDF Gemini (v0.1) dipakai sebagai riwayat pembahasan dan alasan rancangan, bukan sumber instruksi koding lain. Prinsip yang dipertahankan dari catatan itu: struktur sederhana tanpa bundler, mock sebelum model asli, rekomendasi agronomi tanpa angka spekulatif, dan pemeriksaan keamanan pada tahap terkait.

**Belum dikonfirmasi dan tidak boleh diisi dengan tebakan:** artefak serta preprocessing tim data (Lampiran A), sumber/peninjau aturan triase (Lampiran B), PIC dan checkpoint infrastruktur/model, dan hasil pengujian pada perangkat asli. Persetujuan rancangan tidak berarti implementasi atau uji telah lulus.

---

## Lampiran A. Kontrak model dengan tim data

**Status:** Kontrak penyerahan belum lengkap. Tim frontend memakai mock hingga nilai yang diberi tanda `[konfirmasi tim data]` disetujui; tidak ada nilai default yang boleh ditebak. Runtime utama sudah dipilih **TensorFlow.js**. Pergantian ke ONNX perlu keputusan baru dan pembaruan kedua dokumen.

| Item | Nilai yang disepakati / perlu dikonfirmasi |
|------|--------------------------------------------|
| Runtime | TensorFlow.js, versi berkas vendor dibekukan saat implementasi |
| Jenis model/loader | `LayersModel` (`tf.loadLayersModel`) atau `GraphModel` (`tf.loadGraphModel`): **[konfirmasi tim data]** |
| Berkas ekspor | `model.json` beserta seluruh shard `*.bin` dan `labels.json`; daftar/shard aktual: **[konfirmasi tim data]** |
| Bentuk tensor/nama input | Resolusi target 224×224×3 RGB; batch, urutan dimensi, tipe data, dan nama input: **[konfirmasi tim data]** |
| Crop/resize | Sesuai pipeline pelatihan: **[konfirmasi tim data]** |
| Normalisasi | Apakah ada di dalam model atau dilakukan di aplikasi, termasuk skala piksel: **[konfirmasi tim data]** |
| Urutan kelas | Persis isi `labels.json` dari ekspor tim data, empat label Healthy / Pestalotiopsis Leaf Blight / Sigatoka / Cordana Leaf Spot; **urutan indeks belum dikonfirmasi** |
| Output mentah | Bentuk tensor, apakah logits atau probabilitas, dan pemrosesan menjadi empat probabilitas: **[konfirmasi tim data]** |
| Kontrak aplikasi | `{class_name, confidence_score, prediction_source, model_version}`, skor 0–1 dan sumber `mock`/`local`/`server` |
| Versi model | **[konfirmasi tim data]**; disimpan pada hasil scan dan dipakai untuk versi cache |
| Ukuran bobot | Maksimum 15 MB, **verifikasi pada artefak nyata** |
| Contoh pembanding | Satu atau lebih foto input beserta keluaran referensi tim data: **[belum diserahkan]** |
| Uji performa | Perangkat, OS, browser, waktu pemuatan, dan waktu inferensi model siap: **[isi hasil pengujian]** |

Model web yang benar-benar dapat dimuat diperlukan untuk lulus uji luring. Jika hanya endpoint API yang tersedia, alur daring dapat diuji tetapi status deteksi offline tetap **belum selesai**.

## Lampiran B. Tabel calon aturan Panduan Tindak Lanjut (seluruhnya DRAFT)

Tabel berikut menyimpan **usulan untuk diperiksa**, bukan aturan yang sudah divalidasi. Semua baris masih **DRAFT**. Agen koding tidak boleh memakainya sebagai rekomendasi operasional sampai sumber/peninjau dicatat dan status baris secara eksplisit berubah menjadi `tervalidasi`. Tidak boleh mengarang rujukan, angka persentase agronomi, atau tindakan pemangkasan tambahan.

| Kelas | Fase | Calon porsi daun | Calon risiko bobot panen | Calon saran | Rujukan/peninjau | Status |
|-------|------|------------------|-------------------------|------------|------------------|--------|
| Healthy | Tumbuh | Tidak perlu pangkas | Rendah | Lanjutkan perawatan rutin dan pantau berkala. | Belum tersedia | DRAFT |
| Healthy | Berbuah | Tidak perlu pangkas | Rendah | Pertahankan seluruh daun penopang tandan dan pantau berkala. | Belum tersedia | DRAFT |
| Sigatoka | Tumbuh | Hanya daun terdampak parah | Sedang | Pangkas daun bergejala berat, jauhkan sisa daun dari kebun, fokus pada tunas anakan sehat dan sirkulasi udara. | Belum tersedia | DRAFT |
| Sigatoka | Berbuah | Terbatas (hanya yang sudah sangat parah) | Tinggi | Pertahankan daun sehat sebanyak mungkin untuk menopang tandan. Pangkas secukupnya dan konsultasikan ke botani. | Belum tersedia | DRAFT |
| Cordana Leaf Spot | Tumbuh | Hanya daun terdampak | Rendah–Sedang | Pangkas daun bercak, jaga kebersihan kebun, pantau penyebaran ke daun muda. | Belum tersedia | DRAFT |
| Cordana Leaf Spot | Berbuah | Terbatas | Sedang | Pangkas daun terdampak berat saja, pertahankan daun sehat dekat tandan. | Belum tersedia | DRAFT |
| Pestalotiopsis Leaf Blight | Tumbuh | Hanya daun terdampak parah | Sedang | Pangkas bagian yang mengering atau terbakar, buang sisa daun, jaga kebersihan alat. | Belum tersedia | DRAFT |
| Pestalotiopsis Leaf Blight | Berbuah | Terbatas | Sedang–Tinggi | Pangkas hanya daun terdampak berat, jaga daun sehat, konsultasikan ke botani. | Belum tersedia | DRAFT |

**Fallback wajib selama DRAFT:** "Hasil ini adalah identifikasi awal. Amati perubahan kondisi daun, ambil foto ulang jika kurang jelas, dan mintalah peninjauan pakar jika ragu." Fallback tidak menampilkan porsi aman pemangkasan, nilai risiko panen, atau tindakan spesifik berbasis label yang belum tervalidasi. Skor < 0,8 selalu memakai fallback.

## Lampiran C. Checklist uji manual

- [ ] Kamera terbuka lewat HTTPS di ponsel asli.
- [ ] Nilai kecerahan awal diuji pada foto gelap dan terlalu terang; foto ditolak dengan panduan, dan ambang dapat disetel.
- [ ] Batas skor 0,8 diuji: kelas sehat/terindikasi penyakit terpisah dari indikator keyakinan; skor rendah tampil amber dan menawarkan foto ulang/konsultasi.
- [ ] Mode mock menampilkan label simulasi dan skenario tetap sehat/penyakit/keyakinan rendah/gagal; hasil mock tidak masuk kandidat data latih.
- [ ] Setelah kontrak model dikonfirmasi, hasil model browser dibandingkan dengan keluaran referensi tim data; galat model asli tidak diam-diam berubah menjadi mock.
- [ ] Status persiapan luring diuji pada unduhan lengkap, gagal, dan dicoba ulang. Aplikasi tetap dapat menampilkan shell meski model belum siap, tanpa mengklaim deteksi offline.
- [ ] **Ponsel asli:** setelah Siap luring, tutup aplikasi, aktifkan mode pesawat, buka kembali, lalu jalankan kamera, model asli, kamus, dan riwayat. Periksa juga DevTools Offline + reload.
- [ ] Panduan Tindak Lanjut hanya menampilkan aturan tervalidasi; semua baris DRAFT dan skor rendah memakai fallback umum. Tidak ada angka risiko atau arahan pemangkasan spekulatif.
- [ ] Foto bukan daun/di luar empat kelas dicoba untuk mengamati keterbatasan; aplikasi tidak mengklaim memvalidasi jenis objek otomatis.
- [ ] Scan milik akun A tetap terpisah dari akun B saat logout/ganti akun; token kedaluwarsa (401) tidak menghapus antrean scan.
- [ ] Scan yang disimpan luring tersinkron setelah jaringan/API pulih tanpa duplikat; kegagalan sebagian batch tetap antre, dan pengiriman ulang idempoten.
- [ ] Tiket dibuka dari Hasil maupun Riwayat; uji urutan **create → key → encrypt → send** untuk pesan pertama dan penanganan percobaan ulang tanpa tiket ganda.
- [ ] Dua botani mengambil tiket yang sama: hanya satu berhasil, yang lain menerima konflik. Pakar belum ditugaskan hanya melihat ringkasan antrean.
- [ ] Pesan terenkripsi di database; pesan dengan IV/ciphertext yang diubah atau kunci salah gagal didekripsi. Respons kunci, pesan, dan auth tidak ada di Cache API.
- [ ] Peran/objek diuji: pengguna tidak bisa mengakses API akun lain, scan lain, tiket lain, atau foto lain; admin hanya boleh melihat foto dalam antrean kurasi.
- [ ] Untuk fitur Should jika dikerjakan: botani mencatat valid/tidak pasti/tidak layak, admin approve/reject, hasil mock dan tidak valid tidak menjadi kandidat pelatihan.
- [ ] Unggah file bukan gambar atau di atas 5 MB ditolak.
- [ ] PWA terpasang di layar utama dan berfungsi dalam mode pesawat setelah persiapan.
- [ ] Waktu inferensi model siap, pemuatan model, perangkat/browser, serta evaluasi tim data yang tersedia dicatat apa adanya.

Status setiap butir dalam laporan eksekusi: **lulus / gagal / belum diuji**, disertai alasan bila belum dapat diuji. Uji fitur yang baru dijadwalkan sebagai Should tidak menghalangi kriteria selesai Must.
