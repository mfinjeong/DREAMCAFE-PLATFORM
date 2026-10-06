# DREAMCAFE — Aturan Pengembangan

Aturan ini berlaku untuk semua anggota tim (dan asisten AI). Tujuannya: fitur bisa dikerjakan paralel tanpa saling menimpa, dan tidak menumpuk utang teknis. Roadmap fitur ada di [PLAN.md](PLAN.md).

## Kondisi codebase (diverifikasi setelah merge `origin/main`, 2026-10-06)

- Next.js 15 App Router + TypeScript strict + Tailwind + Zod + Prisma (Supabase PostgreSQL).
- **Data layer = Prisma lewat [src/services/](src/services/)** (`pc`, `console`, `session`, `transaction`, `product`, `inventory`, `member`, `booking`). Route di `src/app/api/**` memanggil service. Service melempar `Error` untuk kegagalan bisnis; route menangkapnya dan mengembalikan `{ success: false, message }`.
- Halaman adalah client component yang `fetch()` ke `/api/*`. `npx tsc --noEmit` lulus 0 error.
- Uang sudah dihitung di server untuk POS ([transaction.service.ts](src/services/transaction.service.ts)) dan checkout sesi ([session.service.ts](src/services/session.service.ts)). Nomor `SES-` dan `INV-` berurutan per hari.
- Perlu `.env` dengan `DATABASE_URL` dan `DIRECT_URL` Supabase yang valid (salin dari `.env.example`). `.env` sudah di-ignore; jangan pernah di-commit.

### Utang yang MASIH ADA (kerjakan sebelum atau bersamaan dengan fitur terkait)

| # | Masalah | Lokasi | Dikerjakan oleh |
|---|---|---|---|
| 1 | [reports/page.tsx](src/app/reports/page.tsx) dan [tournaments/page.tsx](src/app/tournaments/page.tsx) masih `import { store } from "@/lib/data-store"` (data seed statis di browser). Padahal `/api/reports` dan `/api/transactions` sudah ada. | halaman | Fitur 4 (reports), Fitur 3 (tournaments) |
| 2 | [src/lib/data-store.ts](src/lib/data-store.ts) adalah kode lama (in-memory). Hapus setelah poin 1 selesai. | lib | PR yang menyelesaikan poin 1 |
| 3 | Tidak ada service/API untuk `Tournament` (modelnya sudah ada di schema). `Maintenance` sudah selesai (`maintenance.service.ts`, `/api/maintenance`, halaman `/maintenance`). | services, api | Fitur 3 |
| 4 | ~~Status MAINTENANCE bisa dilepas manual tanpa tiket servis~~ Selesai: station dengan tiket aktif tidak bisa kembali ke AVAILABLE secara manual (PATCH status dan PUT edit). Memasang MAINTENANCE manual tanpa tiket masih diizinkan. | services | Selesai (Fitur 1) |
| 5 | Tipe transaksi belum punya `DEPOSIT` (`Transaction.type` string di Prisma, union `"SESSION" \| "STORE" \| "MIXED"` di [types.ts](src/lib/types.ts)). | types, services | Fitur 2 |
| 6 | Kode member memakai `Math.random()` ([member.service.ts:126](src/services/member.service.ts#L126)), bisa bentrok. | service | Fitur 2 |
| 7 | Belum ada ESLint (`npm run lint` meminta konfigurasi interaktif), test, dan CI. | root | PR `chore/lint` terpisah |
| 8 | `next@15.1.7` ditandai rentan (CVE-2025-66478) oleh npm. | package.json | PR `chore/deps` terpisah |
| 9 | Belum ada autentikasi; `cashierName` masih `"Admin"`. Rekap shift (Fitur 4) butuh identitas kasir. | — | Putuskan bersama tim sebelum Fitur 4 |

`npm run build` belum diverifikasi setelah merge; jalankan sebelum PR pertama.

## Aturan arsitektur

1. **Alur data satu arah:** halaman → `fetch('/api/...')` → route handler → `src/services/*.service.ts` → Prisma. Halaman dan komponen dilarang meng-import `prisma` atau `data-store`. Route handler dilarang memanggil `prisma` langsung.
2. **Route handler tipis:** parse body → validasi Zod → panggil service → response. Tidak ada logika bisnis di route.
3. **Format response seragam:** sukses `{ success: true, data, message? }`; gagal `{ success: false, message }`. Status: 400 validasi/aturan bisnis, 404 tidak ditemukan, 500 error tak terduga. Pesan dalam Bahasa Indonesia.
4. **Service:** satu file per domain (`<nama>.service.ts`). Kegagalan bisnis = `throw new Error("pesan Indonesia")`. Operasi yang mengubah lebih dari satu tabel wajib dalam `prisma.$transaction`. Service tidak mengubah tabel domain lain secara langsung; panggil fungsi service domain tersebut.
5. **Semua input divalidasi Zod** di [src/lib/validators.ts](src/lib/validators.ts), termasuk body PATCH status (saat ini `api/pc/[id]` memvalidasi manual dengan array string).
6. **Status station hanya berubah lewat service station.** Transisi yang sah (PC dan Console sama):

   | Dari | Ke | Dipicu oleh |
   |---|---|---|
   | AVAILABLE | IN_USE | mulai sesi |
   | IN_USE | AVAILABLE | checkout/stop sesi |
   | AVAILABLE / OFFLINE | MAINTENANCE | tiket servis dibuat |
   | MAINTENANCE | AVAILABLE | tiket terbuka terakhir di-resolve |
   | AVAILABLE / MAINTENANCE | OFFLINE | operator |
   | OFFLINE | AVAILABLE | operator |

   `IN_USE` tidak boleh diset manual. Station yang masih punya tiket servis terbuka (SCHEDULED/IN_PROGRESS) tidak boleh dikembalikan ke AVAILABLE secara manual. Satu station boleh punya beberapa tiket.
7. **Uang dihitung di server.** Client hanya mengirim ID, kuantitas/durasi, dan `cashReceived`. Harga dan total dari database; nominal Rupiah bulat.
8. **Setiap mutasi uang menghasilkan `Transaction`**, termasuk top-up. Saldo member tidak boleh berubah tanpa transaksi.
9. **Kontrak model tunggal:** entitas/enum baru ditambahkan serentak di `schema.prisma`, `types.ts`, `validators.ts`, dan `prisma/seed.ts` dalam PR yang sama, dengan nama persis sama. Perubahan schema: jalankan `npm run prisma:generate` dan `npm run prisma:push` ke database **dev**, bukan database bersama tanpa kesepakatan tim.
10. **Nomor dokumen** (`INV-`, `SES-`, `BK-`, `MNT-`, kode member) berurutan dan unik, bukan acak. Ikuti pola `count + 1` per hari seperti di `session.service.ts`.
11. **Waktu:** simpan UTC (ISO). Tampilkan lewat [formatters.ts](src/lib/formatters.ts) (Asia/Jakarta). "Hari ini" untuk laporan dan booking dihitung dalam zona Asia/Jakarta.
12. **UI:** pakai komponen `src/components/ui/*`; jangan membuat Button/Modal/Table baru. Ikuti gaya visual yang sudah ada di `main` (tema dark esports) dan jangan mengubah token di `tailwind.config.ts`. Jangan menambah `alert()`; tampilkan error di dalam modal atau halaman.
13. **TypeScript:** dilarang `any`, `@ts-ignore`, dan `!` untuk data dari request. Jangan meninggalkan `TODO` tanpa dicatat di PLAN.md.

## Aturan file bersama (anti-conflict)

File yang disentuh banyak fitur: `types.ts`, `validators.ts`, `schema.prisma`, `seed.ts`, `Sidebar.tsx`, `pc.service.ts`, `console.service.ts`.

- Hanya **menambah** di bagian domain sendiri; jangan mengurutkan ulang, me-rename, atau memformat ulang kode orang lain.
- Mengubah kontrak yang dipakai fitur lain dilakukan dalam **PR kecil terpisah** yang di-merge lebih dulu, lalu diumumkan ke tim.
- Item navigasi sidebar: satu baris per fitur.

## Git & Pull Request

- Branch: `feature/<nama>`, `fix/<nama>`, `chore/<nama>`. Dilarang commit langsung ke `main`.
- Commit: Conventional Commits, mis. `feat(maintenance): add resolve ticket endpoint`.
- Jangan `git add .` tanpa melihat `git status`. `.env`, `.next/`, `*.tsbuildinfo` tidak boleh masuk diff.
- Sebelum PR: `git fetch origin` lalu merge `origin/main` ke branch fitur (jangan hanya `main` lokal; bisa tertinggal), selesaikan conflict, jalankan Definition of Done.
- Satu PR = satu fitur/perbaikan; usahakan di bawah ±400 baris diff. Fitur besar dipecah: schema + service + API dulu, UI kemudian.
- Minimal 1 reviewer dari anggota lain sebelum merge.

## Definition of Done (wajib per PR)

- [ ] `npx tsc --noEmit` 0 error
- [ ] `npm run build` sukses
- [ ] `npm run lint` bersih (setelah ESLint dipasang)
- [ ] Diuji manual di `npm run dev`: alur sukses **dan** gagal (uang kurang, station maintenance/in-use, stok habis, input kosong)
- [ ] Halaman terkait masih jalan (dashboard, sessions, store, reports)
- [ ] Baris terkait di tabel "Utang yang masih ada" dan status di PLAN.md diperbarui
- [ ] Deskripsi PR: apa yang berubah, cara mengetes, screenshot UI

## Dependensi antar fitur

| Fitur | Bergantung pada | Catatan |
|---|---|---|
| 1. Maintenance | utang #3, #4 | Buat `maintenance.service.ts` + `/api/maintenance`. Stasiun diubah lewat service PC/Console (aturan 6). Dukungan Console sudah punya `api/consoles/[id]`. |
| 2. Top-Up Member | utang #5, #6, aturan 8 | Reward coin/XP dihitung di server; transaksi `DEPOSIT` masuk laporan. |
| 3. Turnamen | utang #1, #3 | Buat `tournament.service.ts`; definisikan tipe TS untuk `bracketData` (JSON string) dulu. |
| 4. Laporan & Shift | utang #1, #5, #9 | Model `Shift` belum ada di schema; sepakati dulu. Gunakan `/api/reports` yang sudah ada sebagai dasar. |
| 5. Struk Termal | aturan 10 | Ambil data dari `Transaction`, jangan hitung ulang di client. |
| 6. Settings Tarif | keputusan tim | Tarif saat ini per station (`hourlyRate`), PLAN.md menyebut per zona. Putuskan sumber kebenaran dulu. |

## Perintah

```bash
npm install
npm run prisma:generate
npm run dev          # http://localhost:3000
npx tsc --noEmit
npm run build
```
