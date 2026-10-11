# Backend Google Sheets — KLIK-PBJ Simeulue

Migrasi penyimpanan localStorage → Google Sheets + Google Drive.
Folder ini TIDAK mengubah kode aplikasi; frontend diganti tahap berikutnya.

## File

- `Setup.gs` — dijalankan sekali: buat 6 tab + seed (counters, 6 user, settings, 12 dokumen) + folder Drive + token.
- `Seed.gs` — opsional: Run `seed_dummy()` untuk generate 20 tiket contoh (abort bila Tickets sudah berisi data).
- `Code.gs` — backend Web App (baca/tulis tiket, balasan, user, settings, dokumen, upload).

## Langkah deploy

1. Buat spreadsheet kosong baru (mis. "KLIK-PBJ-DB"). **Jangan share ke siapa pun.**
2. Menu Extensions > Apps Script. Hapus isi editor, tempel `Setup.gs`, Save.
3. Di dropdown fungsi pilih `setup_klikpbj` > Run. Setujui izin (akun Anda sendiri).
4. Buka Executions > log terakhir, catat:
   - `API_TOKEN` (rahasia — untuk tulis/admin nanti)
   - `UPLOAD_FOLDER_ID`
5. Tambah file script: tombol `+` > Script, beri nama `Code`, tempel isi `Code.gs`, Save.
6. Deploy > New deployment > tipe Web app:
   - Execute as: **Me**
   - Who has access: **Anyone** (perlu agar form publik bisa kirim; tulis sensitif tetap dikunci token/sesi)
   - Deploy, salin URL `/exec`.
7. Uji cepat di browser: `<exec-url>?action=ping` → `{"ok":true,...}`.

## Batasan & keamanan

- Sheet privat: hanya akun owner + (nanti) akun petugas yang perlu audit.
- Password user tersimpan plaintext di tab Users — jangan share sheet.
- Daftar publik (`ticketsPublic`) hanya kirim data termasking; NIP/WA penuh hanya keluar lewat `verifyTicket` (digit cocok) atau sesi petugas.
- Sesi petugas kedaluwarsa 12 jam (Cache). Token API tidak dipakai frontend publik kecuali untuk tulis.
- File ≤ ~11MB (PDF/PNG/JPG) → folder `KLIK-PBJ-Files`, akses "anyone with link".
- Nomor tiket (`PB-00001` dst.) dibuat atomik server via `Counters` + `LockService` — aman dipakai banyak perangkat.
- Tiket seed dummy TIDAK diimpor (sheet mulai kosong); user/settings/docs ikut dari `data-seed.json` saat file ini dibuat.

## Tahap berikutnya (belum dikerjakan)

Ganti data-layer frontend (`src/lib/store.ts`) memanggil URL `/exec` ini, dengan fallback localStorage bila offline. Sesi login & draft form tetap di browser.
