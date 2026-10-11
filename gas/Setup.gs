/**********************************************************************
 * KLIK-PBJ SIMEULUE — Setup spreadsheet (dijalankan SEKALI)
 *
 * Cara pakai:
 *  1. Buat spreadsheet kosong di Google Sheets (jangan share ke siapa pun).
 *  2. Extensions > Apps Script, hapus isi editor, tempel SELURUH file ini.
 *  3. Pilih fungsi `setup_klikpbj` > Run (setujui izin saat diminta).
 *  4. Catat API_TOKEN yang muncul di log (Executions) — dipakai backend.
 *  5. Tambahkan file Code.gs ke project yang sama (tombol + > Script).
 *
 * Fungsi ini idempoten: sheet yang sudah ada tidak dihapus, baris seed
 * hanya ditambahkan bila sheet masih kosong (kecuali header).
 **********************************************************************/

var TAB_TICKETS = 'Tickets';
var TAB_REPLIES = 'Replies';
var TAB_USERS = 'Users';
var TAB_SETTINGS = 'Settings';
var TAB_DOCS = 'Docs';
var TAB_COUNTERS = 'Counters';

var HEADERS = {};
HEADERS[TAB_TICKETS] = ['kode','nama','nip','jabatan','skpk','wa','jenis_layanan','tahapan','metode','nama_paket','nilai','uraian','pertanyaan','bentuk','file_name','file_drive_id','status','ringkasan','is_published','menunggu_petugas','created_at','updated_at'];
HEADERS[TAB_REPLIES] = ['id','ticket_kode','dari','teks','created_at'];
HEADERS[TAB_USERS] = ['id','email','pass','nama','role','layanan','aktif'];
HEADERS[TAB_SETTINGS] = ['key','value'];
HEADERS[TAB_DOCS] = ['id','judul','kategori','tag','desc','file_name','drive_id_atau_url','tipe','size','created_at'];
HEADERS[TAB_COUNTERS] = ['prefix','last_number'];

var SEED_COUNTERS = [['PB', 0], ['JK', 0], ['JT', 0], ['JL', 0], ['PK', 0]];

var SEED_USERS = [
 {"id": "u-seed-0", "email": "admin@simeuluekab.go.id", "pass": "admin123", "nama": "Admin PBJ", "role": "admin", "layanan": "", "aktif": true},
 {"id": "u-seed-1", "email": "tim-barang@simeuluekab.go.id", "pass": "tim123", "nama": "Tim Pengadaan Barang", "role": "tim", "layanan": "Pengadaan Barang", "aktif": true},
 {"id": "u-seed-2", "email": "tim-konstruksi@simeuluekab.go.id", "pass": "tim123", "nama": "Tim Jasa Konstruksi", "role": "tim", "layanan": "Jasa Konstruksi", "aktif": true},
 {"id": "u-seed-3", "email": "tim-konsultansi@simeuluekab.go.id", "pass": "tim123", "nama": "Tim Jasa Konsultansi", "role": "tim", "layanan": "Jasa Konsultansi", "aktif": true},
 {"id": "u-seed-4", "email": "tim-lainnya@simeuluekab.go.id", "pass": "tim123", "nama": "Tim Jasa Lainnya", "role": "tim", "layanan": "Jasa Lainnya", "aktif": true},
 {"id": "u-seed-5", "email": "tim-pascakontrak@simeuluekab.go.id", "pass": "tim123", "nama": "Tim Pasca Kontrak", "role": "tim", "layanan": "Pasca Kontrak", "aktif": true}
];

var SEED_SETTINGS = [
 {"key": "heroTitle", "value": "KLIK-PBJ SIMEULUE"},
 {"key": "heroSubtitle", "value": "Klinik Layanan Integrasi Konsultasi Pengadaan Barang dan Jasa"},
 {"key": "infoText", "value": "Visi Kabupaten Simeulue Tahun 2030: Mewujudkan Simeulue yang bermartabat & pusat pertumbuhan ekonomi biru."},
 {"key": "disclaimerText", "value": "Tanggapan Tim KLIK-PBJ bersifat konsultatif dan merupakan bahan pertimbangan, berdasarkan informasi dan dokumen yang disampaikan pada saat konsultasi. Tanggapan ini tidak mengambil alih kewenangan maupun tanggung jawab pejabat yang berwenang. Pihak yang berkonsultasi dapat memiliki pendapat berbeda dan wajib memastikan keputusan yang diambil sesuai ketentuan peraturan perundang-undangan. Segala keputusan, tindakan, dan konsekuensi atas pelaksanaannya menjadi tanggung jawab pihak/pejabat yang berwenang."},
 {"key": "disclaimerAktif", "value": true},
 {"key": "jamLayanan", "value": "Senin–Jumat • 08.00–16.00 WIB"},
 {"key": "layananCustom", "value": []}
];

var SEED_DOCS = [
 {"id": "doc-d1", "judul": "REGULASI UTAMA PBJ", "kategori": "Dasar Hukum", "tag": "Dasar Hukum", "desc": "Perpres 16/2018, 12/2021, 46/2025 & 17/2023.", "file_name": "", "drive_id_atau_url": "https://drive.google.com/drive/folders/1ccLWnoI9Kv1fZ1BS8XWRq6dMEfb8kel-", "tipe": "url", "size": "", "created_days_ago": 0},
 {"id": "doc-d2", "judul": "KELEMBAGAAN DAN SDM", "kategori": "Dasar Hukum", "tag": "Dasar Hukum", "desc": "UKPBJ, SDM & rencana aksi.", "file_name": "", "drive_id_atau_url": "https://drive.google.com/drive/folders/1G2fD1hripGETh1PMlo44WHRO202n8hq6", "tipe": "url", "size": "", "created_days_ago": 0},
 {"id": "doc-d3", "judul": "TKDN/P3DN", "kategori": "Dasar Hukum", "tag": "Dasar Hukum", "desc": "UU 3/2014, PP 29/2018, Inpres 2/2022 & Permenperin 35/2025.", "file_name": "", "drive_id_atau_url": "https://drive.google.com/drive/folders/1ZQ1gqFg2yTWe5sNDxhn3CkaDxE7c0P62", "tipe": "url", "size": "", "created_days_ago": 0},
 {"id": "doc-d4", "judul": "KATALOG DAN DIGITAL PBJ", "kategori": "Panduan", "tag": "Panduan", "desc": "Katalog elektronik & transformasi digital.", "file_name": "", "drive_id_atau_url": "https://drive.google.com/drive/folders/1yI6m5uXyDfmjoq1WYwEbhlO0-4tQqMOF", "tipe": "url", "size": "", "created_days_ago": 0},
 {"id": "doc-d5", "judul": "PELAKSANAAN MELALUI PENYEDIA", "kategori": "Panduan", "tag": "Panduan", "desc": "Perlem 12/2021 & 4/2024.", "file_name": "", "drive_id_atau_url": "https://drive.google.com/drive/folders/1QvUUDMRrACW-NFR9DP0lX3-zxi9YMiWg", "tipe": "url", "size": "", "created_days_ago": 0},
 {"id": "doc-d6", "judul": "PERENCANAAN", "kategori": "Panduan", "tag": "Panduan", "desc": "Perlem 11/2021 pedoman perencanaan.", "file_name": "", "drive_id_atau_url": "https://drive.google.com/drive/folders/1Q8egMytqgUfqgcoOiezJACd2UGm5ePK1", "tipe": "url", "size": "", "created_days_ago": 0},
 {"id": "doc-d7", "judul": "SWAKELOLA DAN PENGADAAN KHUSUS", "kategori": "Panduan", "tag": "Panduan", "desc": "Swakelola & BLUD.", "file_name": "", "drive_id_atau_url": "https://drive.google.com/drive/folders/1GahDqAsObpoSMokO__IpWUac1LgZD9oU", "tipe": "url", "size": "", "created_days_ago": 0},
 {"id": "doc-d8", "judul": "Pedoman Pelaksanaan APBD Tahun 2026.pdf", "kategori": "Panduan", "tag": "Panduan", "desc": "Pedoman pelaksanaan APBD 2026.", "file_name": "", "drive_id_atau_url": "https://drive.google.com/file/d/1DnwdxtBHf6PBk8b2eeGdEgC3tKGhPWjf/view", "tipe": "url", "size": "", "created_days_ago": 0},
 {"id": "doc-d9", "judul": "Pemberitahuan Perubahan Kedua Perpres 16 Tahun 2028.pdf", "kategori": "Dasar Hukum", "tag": "Dasar Hukum", "desc": "Pemberitahuan perubahan kedua Perpres 16.", "file_name": "", "drive_id_atau_url": "https://drive.google.com/file/d/1Scf2yrLi5zou0Xk8NDWVdaU0_p16cYDD/view", "tipe": "url", "size": "", "created_days_ago": 0},
 {"id": "doc-d10", "judul": "Perbedaan Perpres 2021 dengan 2025.pdf", "kategori": "Dasar Hukum", "tag": "Dasar Hukum", "desc": "Matriks perbedaan Perpres 2021 vs 2025.", "file_name": "", "drive_id_atau_url": "https://drive.google.com/file/d/1S-QC3gdpeE9ScnL5-s3n4aTnBmASs9m_/view", "tipe": "url", "size": "", "created_days_ago": 0},
 {"id": "doc-d11", "judul": "SURAT LKPP 2025_WAJIB MIKOM KOMPETISI.pdf", "kategori": "Dasar Hukum", "tag": "Dasar Hukum", "desc": "Surat LKPP kewajiban mikom kompetisi.", "file_name": "", "drive_id_atau_url": "https://drive.google.com/file/d/1t7X2cmops42pYOdgbVRKJ5jWBmA0qlcP/view", "tipe": "url", "size": "", "created_days_ago": 0},
 {"id": "doc-d12", "judul": "JDIH LKPP – sumber regulasi resmi.txt", "kategori": "Lainnya", "tag": "Lainnya", "desc": "Tautan sumber regulasi resmi JDIH LKPP.", "file_name": "", "drive_id_atau_url": "https://drive.google.com/file/d/1yYYFU5MOQQNVzdnvhB2lAhYs0b4VIFOP/view", "tipe": "url", "size": "", "created_days_ago": 0}
];

function daysAgoIso(n) {
  var d = new Date();
  d.setDate(d.getDate() - (n || 0));
  d.setHours(9 + ((n || 0) % 8), 12, 0, 0);
  return d.toISOString();
}

function ensureTab_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS[name]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function seedIfEmpty_(ss, name, rows) {
  var sh = ss.getSheetByName(name);
  if (sh.getLastRow() <= 1 && rows.length > 0) {
    sh.getRange(2, 1, rows.length, HEADERS[name].length).setValues(rows);
  }
}

function setup_klikpbj() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var names = [TAB_TICKETS, TAB_REPLIES, TAB_USERS, TAB_SETTINGS, TAB_DOCS, TAB_COUNTERS];
  for (var i = 0; i < names.length; i++) ensureTab_(ss, names[i]);

  seedIfEmpty_(ss, TAB_COUNTERS, SEED_COUNTERS);
  seedIfEmpty_(ss, TAB_USERS, SEED_USERS.map(function (u) {
    return [u.id, u.email, u.pass, u.nama, u.role, u.layanan, u.aktif];
  }));
  seedIfEmpty_(ss, TAB_SETTINGS, SEED_SETTINGS.map(function (s) {
    var v = s.value;
    if (v !== null && typeof v === 'object') v = JSON.stringify(v);
    return [s.key, v];
  }));
  seedIfEmpty_(ss, TAB_DOCS, SEED_DOCS.map(function (d) {
    return [d.id, d.judul, d.kategori, d.tag, d.desc, d.file_name, d.drive_id_atau_url, d.tipe, d.size, daysAgoIso(d.created_days_ago)];
  }));
  // Tickets & Replies sengaja mulai kosong (nomor tiket jalan dari Counters).

  // Folder Drive untuk lampiran (privat milik akun ini; file dibuka via link).
  var folder;
  var found = DriveApp.getFoldersByName('KLIK-PBJ-Files');
  folder = found.hasNext() ? found.next() : DriveApp.createFolder('KLIK-PBJ-Files');

  var props = PropertiesService.getScriptProperties();
  props.setProperty('UPLOAD_FOLDER_ID', folder.getId());
  var token = props.getProperty('API_TOKEN');
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '');
    props.setProperty('API_TOKEN', token);
  }
  Logger.log('OK setup. UPLOAD_FOLDER_ID=' + folder.getId());
  Logger.log('API_TOKEN (RAHASIA, simpan baik-baik)=' + token);
}
