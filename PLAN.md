# 📋 DREAMCAFE — Rencana Pengembangan & Roadmap Fitur Kelompok (PLAN.md)

Dokumen ini memuat analisis fitur yang belum selesai/belum ada di proyek **DREAMCAFE**, spesifikasi teknis untuk setiap modul, serta panduan alur kerja (*branching strategy*) agar kerja kelompok berjalan lancar tanpa bentrok (*merge conflict*).

---

## 📑 Daftar Isi
1. [Status Codebase Saat Ini](#-status-codebase-saat-ini)
2. [Daftar Fitur yang Bisa Dibuat / Dikembangkan](#-daftar-fitur-yang-bisa-dibuat--dikembangkan)
   - [Fitur 1: Manajemen Pemeliharaan & Tiket Servis Hardware (Maintenance)](#1--manajemen-pemeliharaan--tiket-servis-hardware)
   - [Fitur 2: Top-Up Saldo Tunai Member & Riwayat Transaksi Akun](#2--top-up-saldo-tunai-member--riwayat-transaksi-akun)
   - [Fitur 3: Esports Hub & Interactive Tournament Bracket](#3--esports-hub--interactive-tournament-bracket)
   - [Fitur 4: Rekap Shift Tutup Kasir (Shift Settlement) & Export CSV Laporan](#4--rekap-shift-tutup-kasir--export-laporan-finansial)
   - [Fitur 5: Format Struk Kasir Termal Siap Cetak (Thermal Receipt 58mm/80mm)](#5--format-struk-kasir-termal-siap-cetak)
   - [Fitur 6: Persistensi Pengaturan Tarif & Kebijakan Operasional](#6--persistensi-pengaturan-tarif-sistem)
3. [Panduan Alur Kerja Git & Pembuatan Branch](#-panduan-git--branching-kelompok)
4. [Tabel Pembagian Tugas Tim](#-rekomendasi-pembagian-tugas-tim)

---

## 🔍 Status Codebase Saat Ini

| Modul | Status Saat Ini | Keterangan & Catatan |
|---|---|---|
| **PC & Console Station** | ✅ Selesai | Monitoring status, zonasi tarif, modal audit hardware |
| **Biling & Live Timer** | ✅ Selesai | Siklus sesi, live countdown timer per detik, tambah durasi (+time) |
| **Store & Kasir POS** | ✅ Selesai | Keranjang belanja, perhitungan kembalian tunai, pengurangan stok |
| **Inventaris & Mutasi Stok** | ✅ Selesai | Stock In, Stock Out, Adjustment, Audit log riwayat mutasi |
| **Booking / Reservasi** | ✅ Selesai | Conflict detection jadwal tabrakan, pembuatan tiket booking |
| **Member Directory** | ⚠️ Setengah Selesai | Baru bisa register member & lihat profile. **Belum bisa isi/top-up saldo tunai**. |
| **Esports / Turnamen** | ⚠️ Mock / Statis | Data statis in-memory. Tombol *"Register Team"* belum berfungsi, belum ada bracket. |
| **Maintenance Hardware** | ❌ Belum Ada UI | Skema tabel `Maintenance` sudah ada di database Prisma, tapi belum ada UI/API. |
| **Laporan Finansial** | ⚠️ Dasar | Rekap total omset tunai ada, tapi belum ada filter tanggal & export CSV. |
| **Pengaturan / Settings** | ⚠️ Mock | Tombol simpan baru berupa animasi `setTimeout`, belum tersimpan ke backend. |

---

## 🚀 Daftar Fitur yang Bisa Dibuat / Dikembangkan

### 1. 🛠️ Manajemen Pemeliharaan & Tiket Servis Hardware
> **Prioritas**: ⭐⭐⭐⭐⭐ (Sangat Direkomendasikan)  
> **Status Schema**: Model `Maintenance` sudah tersedia di `prisma/schema.prisma`.

#### Kebutuhan & Masalah:
Di warnet/gaming center, mouse sering rusak, keyboard error, headphone putus sebelah, atau PC mengalami overheat/BSOD. Operator perlu mencatat tiket kendala, menugaskan teknisi, melacak estimasi biaya, dan mengunci station agar tidak disewa pelanggan selama perbaikan.

#### Rencana Implementasi:
- **UI / Tampilan**:
  - Halaman atau Sub-tab di `/pc` dan `/consoles` atau rute khusus `/maintenance`.
  - Tabel tiket servis: Kode Tiket, Station (PC/Console), Keluhan Kerusakan, Teknisi, Estimasi Biaya, Status (`SCHEDULED`, `IN_PROGRESS`, `RESOLVED`).
  - Modal **"Lapor Kerusakan / Buat Tiket Servis"**:
    - Pilih station yang bermasalah.
    - Input keluhan (misal: *"Monitor berkedip saat 240Hz"*, *"Klik kiri mouse mati"*).
    - Status station otomatis berubah menjadi `MAINTENANCE` dan tidak bisa disewa di biling.
  - Modal **"Selesaikan Perbaikan (Resolve)"**:
    - Input biaya aktual perbaikan & catatan perbaikan teknisi.
    - Status station otomatis kembali menjadi `AVAILABLE`.
- **Backend & Data**:
  - `GET /api/maintenance` (Daftar tiket servis)
  - `POST /api/maintenance` (Buat tiket baru)
  - `PATCH /api/maintenance/[id]` (Update status pengerjaan atau tandai selesai)
- **Nama Branch Rekomendasi**: `feature/station-maintenance`

---

### 2. 💳 Top-Up Saldo Tunai Member & Riwayat Transaksi Akun
> **Prioritas**: ⭐⭐⭐⭐⭐ (Sangat Direkomendasikan)  
> **Kaitan Modul**: Member (`/members`) & Kasir POS (`/store`)

#### Kebutuhan & Masalah:
Member yang terdaftar saldonya dapat habis setelah bermain beberapa jam. Saat ini belum ada antarmuka bagi kasir untuk menerima uang tunai dari pelanggan dan menambahkan saldo deposit akun mereka.

#### Rencana Implementasi:
- **UI / Tampilan**:
  - Tombol **"Top-Up Saldo"** di halaman `/members` dan pada modal Detail Member.
  - Modal Top-Up Saldo Tunai:
    - Informasi member: Username, Nama, Sisa Saldo saat ini.
    - Input nominal deposit (minimal Rp10.000).
    - Tombol pecahan cepat: `+Rp20.000`, `+Rp50.000`, `+Rp100.000`, `+Rp200.000`.
    - Input uang tunai diterima & kalkulasi otomatis kembalian tunai.
    - Perhitungan reward loyalitas otomatis: Setiap deposit Rp10.000 mendapat `10 DREAM Coins` dan `50 XP`.
  - Tab **"Riwayat Deposit & Transaksi"** di dalam modal profil member.
- **Backend & Data**:
  - `POST /api/members/[id]/topup`
  - Transaksi otomatis tercatat ke daftar `Transaction` dengan tipe `DEPOSIT` agar masuk ke buku kasir harian.
- **Nama Branch Rekomendasi**: `feature/member-topup`

---

### 3. 🏆 Esports Hub & Interactive Tournament Bracket
> **Prioritas**: ⭐⭐⭐⭐  
> **Kaitan Modul**: Turnamen (`/tournaments`)

#### Kebutuhan & Masalah:
Halaman `/tournaments` saat ini hanya menampilkan kartu statis turnamen dan daftar tim tanpa kemampuan interaksi. Tombol *"Register Team"* belum terpasang event handler.

#### Rencana Implementasi:
- **UI / Tampilan**:
  - Modal **"Daftarkan Tim Turnamen"**:
    - Pilih turnamen yang berstatus `UPCOMING`.
    - Pilih tim atau buat tim baru (Nama tim, tag clan, kapten, nomor kontak).
    - Validasi jumlah kuota tim (misal maksimal 8 atau 16 tim).
  - Tampilan **Bagan Bracket Turnamen**:
    - Komponen visual bagan sistem gugur (Quarter-final, Semifinal, Grand Final).
    - Operator dapat mengklik pertandingan untuk memasukkan skor (misal: Team A 2 - 1 Team B) dan otomatis meloloskan pemenang ke babak berikutnya.
  - Modal **"Buat Turnamen Baru"** untuk admin/operator.
- **Backend & Data**:
  - `GET /api/tournaments` & `POST /api/tournaments`
  - `POST /api/tournaments/[id]/register`
  - `PATCH /api/tournaments/[id]/match` (Input skor & pemenang pertandingan)
- **Nama Branch Rekomendasi**: `feature/tournament-brackets`

---

### 4. 📊 Rekap Shift Tutup Kasir & Export Laporan Finansial
> **Prioritas**: ⭐⭐⭐⭐  
> **Kaitan Modul**: Laporan Keuangan (`/reports`)

#### Kebutuhan & Masalah:
Karena operasional DREAMCAFE 100% menggunakan uang tunai fisik (*Cash Only*), kasir memerlukan fitur rekonsiliasi uang fisik di laci kasir saat pergantian shift (pagi/malam), serta kemampuan mengunduh data pembukuan.

#### Rencana Implementasi:
- **UI / Tampilan**:
  - **Filter Periode Laporan**: Tombol cepat `Hari Ini`, `7 Hari Terakhir`, `Bulan Ini`, atau pilih tanggal kustom.
  - **Filter Tipe Pendapatan**: Semua, Sesi Biling Saja, Toko/F&B Saja, atau Deposit Member.
  - Tombol **"Export CSV"**: Mengunduh seluruh log invoice transaksi ke format file `.csv` yang bisa dibuka di Microsoft Excel / Google Sheets.
  - Modal **"Tutup Kasir / Rekap Shift"**:
    - Ringkasan otomatis: Modal Kas Awal + Total Uang Tunai Masuk = Total Uang Fisik Seharusnya.
    - Kasir menginput jumlah uang fisik yang dihitung di laci.
    - Sistem menghitung selisih kas (*discrepancy* / lebih atau kurang) untuk audit pengelola.
- **Backend & Data**:
  - `GET /api/reports/summary?range=today|week|month`
  - `GET /api/reports/export-csv`
- **Nama Branch Rekomendasi**: `feature/reports-shift-export`

---

### 5. 🧾 Format Struk Kasir Termal Siap Cetak
> **Prioritas**: ⭐⭐⭐⭐  
> **Kaitan Modul**: POS Store (`/store`), Selesai Sesi (`/sessions`)

#### Kebutuhan & Masalah:
Saat kasir menyelesaikan transaksi F&B atau checkout biling, pelanggan biasanya memerlukan struk kertas fisik kasir.

#### Rencana Implementasi:
- **UI / Tampilan**:
  - Komponen cetak struk khusus (format lebar 58mm atau 80mm kertas termal).
  - Berisi: Header logo DREAMCAFE, alamat & kontak cabang, nomor invoice, tanggal & jam, rincian barang/durasi sewa, total tagihan, uang tunai diterima, kembalian, dan ucapan terima kasih.
  - Menggunakan CSS print media query (`@media print`) sehingga saat tombol *"Cetak Struk"* diklik, hanya struk yang dicetak bersih tanpa navbar/sidebar aplikasi.
- **Nama Branch Rekomendasi**: `feature/thermal-receipt`

---

### 6. ⚙️ Persistensi Pengaturan Tarif Sistem
> **Prioritas**: ⭐⭐⭐  
> **Kaitan Modul**: Pengaturan (`/settings`)

#### Kebutuhan & Masalah:
Saat ini form perubahan tarif per jam di halaman `/settings` belum tersimpan permanen ke backend data store / database.

#### Rencana Implementasi:
- API endpoint `GET /api/settings` dan `PUT /api/settings`.
- Mengubah tarif per jam untuk zona Regular, VIP, Arena, Console PS5, dan Switch secara terpusat di `data-store.ts` dan database.
- **Nama Branch Rekomendasi**: `feature/settings-persistence`

---

## 🌿 Panduan Git & Branching Kelompok

Untuk mencegah kode kalian saling menimpa (*conflict*), ikuti aturan alur kerja Git berikut:

### 1. Sinkronisasi Kode Terbaru dari `main`
Sebelum membuat branch baru, pastikan branch `main` lokal kamu sudah sama dengan repository GitHub:
```bash
# Pastikan berada di branch main
git checkout main

# Ambil dan gabungkan commit terbaru dari teman kelompok
git pull origin main
```

---

### 2. Membuat Branch Baru
Gunakan format nama branch: `feature/nama-fitur` atau `fitur-namaanggota/nama-fitur`.

Contoh jika memilih mengerjakan **Manajemen Maintenance**:
```bash
git checkout -b feature/station-maintenance
```

Contoh jika memilih mengerjakan **Top-Up Member**:
```bash
git checkout -b feature/member-topup
```

Contoh jika memilih mengerjakan **Esports Bracket**:
```bash
git checkout -b feature/tournament-brackets
```

> **Tips**: Perintah `git checkout -b <nama-branch>` akan otomatis membuat branch baru dan langsung berpindah ke branch tersebut.

---

### 3. Menyimpan Pekerjaan (Commit)
Lakukan commit secara bertahap dengan pesan yang jelas dalam bahasa Indonesia atau Inggris:
```bash
# Cek file mana saja yang sudah diubah
git status

# Tambahkan perubahan ke staging
git add .

# Buat commit dengan pesan deskriptif
git commit -m "feat(maintenance): add maintenance ticket modal and api endpoint"
```

---

### 4. Mengunggah Branch ke GitHub (Push)
Saat pertama kali mengunggah branch baru ke GitHub:
```bash
git push -u origin <nama-branch-kamu>

# Contoh:
# git push -u origin feature/station-maintenance
```

Setelah push pertama, untuk commit selanjutnya cukup jalankan:
```bash
git push
```

---

### 5. Membuat Pull Request (PR) di GitHub
1. Buka repositori di browser: [GitHub DREAMCAFE-PLATFORM](https://github.com/mfinjeong/DREAMCAFE-PLATFORM)
2. Klik tombol **"Compare & pull request"** pada branch yang baru saja kamu push.
3. Beri deskripsi ringkas tentang apa yang kamu buat atau perbaiki.
4. Minta anggota kelompok lain me-review sebelum di-*merge* ke `main`.

---

### 6. Tips Menghindari Conflict Antar Anggota
1. **Jangan bekerja di branch `main` langsung.** Selalu buat branch fitur masing-masing.
2. **Hindari mengubah file yang sama pada waktu yang sama.** Misalnya: Anggota A fokus di folder `src/app/members/`, Anggota B fokus di `src/app/tournaments/`, Anggota C fokus di `src/app/reports/`.
3. **Sebelum melakukan Pull Request**, tarik pembaruan dari `main` ke branch fiturnmu:
   ```bash
   git checkout feature/nama-fitur
   git pull origin main
   ```
   Jika ada conflict, selesaikan di VS Code/editor, lalu commit dan push kembali.

---

## 👥 Rekomendasi Pembagian Tugas Tim

| No | Anggota Tim | Fitur yang Direkomendasikan | Lokasi File Utama |
|---|---|---|---|
| 1 | **Anggota 1** | Modul Maintenance Hardware & Servis | `src/app/pc/`, `src/app/consoles/`, `src/app/api/maintenance/` |
| 2 | **Anggota 2** | Fitur Top-Up Saldo Tunai & Profil Member | `src/app/members/`, `src/app/api/members/`, `src/components/modals/` |
| 3 | **Anggota 3** | Esports Hub, Pendaftaran Tim & Bagan Bracket | `src/app/tournaments/`, `src/app/api/tournaments/` |
| 4 | **Anggota 4** | Rekap Shift Kasir, Export CSV & Struk Termal | `src/app/reports/`, `src/app/store/`, `src/components/modals/` |
