/**********************************************************************
 * KLIK-PBJ SIMEULUE — Backend Web App (Apps Script)
 *
 * Prasyarat: jalankan `setup_klikpbj` dari Setup.gs di project yang sama.
 * Deploy: Deploy > New deployment > Web app — Execute as: Me,
 * Who has access: Anyone. Setiap deploy ulang ambil URL /exec terbaru.
 *
 * Catatan frontend (nanti): kirim POST dengan header
 * `Content-Type: text/plain` (hindari preflight CORS); body tetap JSON.
 **********************************************************************/

var T_TICKETS = 'Tickets';
var T_REPLIES = 'Replies';
var T_USERS = 'Users';
var T_SETTINGS = 'Settings';
var T_DOCS = 'Docs';
var T_COUNTERS = 'Counters';

// Awalan kode per layanan (mirror referensi.kodePrefix di data-seed.json).
var KODE_PREFIX = {
  'Pengadaan Barang': 'PB',
  'Jasa Konstruksi': 'JK',
  'Jasa Konsultansi': 'JT',
  'Jasa Lainnya': 'JL',
  'Pasca Kontrak': 'PK'
};

var MIME_OK = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
var UPLOAD_MAX_B64 = 15 * 1024 * 1024; // ~11MB file
var SESSION_TTL = 12 * 3600; // sesi petugas 12 jam

/* ---------------- util dasar ---------------- */

function props_() { return PropertiesService.getScriptProperties(); }
function cache_() { return CacheService.getScriptCache(); }
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Sheet hilang: ' + name + ' (jalankan setup_klikpbj)');
  return sh;
}

function data_(name) {
  var sh = sheet_(name);
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
}

function obj_(header, row) {
  var o = {};
  for (var i = 0; i < header.length; i++) o[header[i]] = row[i];
  return o;
}

function headerOf_(name) {
  return sheet_(name).getRange(1, 1, 1, sheet_(name).getLastColumn()).getValues()[0];
}

function find_(name, key, val) {
  // bandingkan trimmed + case-insensitive (untuk kode/email)
  var h = headerOf_(name);
  var ci = h.indexOf(key);
  if (ci < 0) throw new Error('Kolom hilang: ' + key);
  var want = String(val == null ? '' : val).trim().toLowerCase();
  var rows = data_(name);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][ci] == null ? '' : rows[i][ci]).trim().toLowerCase() === want) {
      return { row: i + 2, o: obj_(h, rows[i]) };
    }
  }
  return null;
}

function uid_() { return Utilities.getUuid().replace(/-/g, '').slice(0, 12); }
function iso_() { return new Date().toISOString(); }
function bool_(v) { return v === true || String(v).trim().toUpperCase() === 'TRUE'; }
function digits_(s) { return String(s == null ? '' : s).replace(/\D/g, ''); }
function last4_(s) { var d = digits_(s); return d.slice(-4); }

function maskNama_(nama) {
  nama = String(nama || '').trim();
  if (!nama) return '***';
  var first = nama.split(/\s+/)[0] || '';
  if (first.length <= 2) return first + '***';
  return first.slice(0, Math.min(5, first.length)) + ' ***';
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function fail_(code, message) { return { ok: false, code: code, error: message }; }

function parseSettingsValue_(v) {
  if (v === true || v === false) return v;
  var s = String(v == null ? '' : v);
  if (s === 'TRUE') return true;
  if (s === 'FALSE') return false;
  if (/^[\[{]/.test(s.trim())) { try { return JSON.parse(s); } catch (e) { /* biarkan string */ } }
  return s;
}

/* ---------------- sesi petugas ---------------- */

function login_(email, pass) {
  var f = find_(T_USERS, 'email', email);
  if (!f || String(f.o.pass) !== String(pass)) return null;
  if (!bool_(f.o.aktif)) return { disabled: true };
  var sess = { email: f.o.email, nama: f.o.nama, role: (f.o.role === 'admin' ? 'admin' : 'tim'), layanan: f.o.layanan || '' };
  var token = Utilities.getUuid().replace(/-/g, '');
  cache_().put('sess_' + token, JSON.stringify(sess), SESSION_TTL);
  sess.token = token;
  return sess;
}

function me_(token) {
  if (!token) return null;
  try {
    var raw = cache_().get('sess_' + token);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function needAdmin_(sess) {
  if (!sess) throw fail_(401, 'Sesi petugas diperlukan.');
  if (sess.role !== 'admin') throw fail_(403, 'Hanya admin.');
}

function scopeOk_(sess, ticket) {
  if (!sess) return false;
  if (sess.role === 'admin') return true;
  return !sess.layanan || ticket.jenis_layanan === sess.layanan;
}

/** Buang file Drive ke Trash. Hanya untuk ID Drive murni (URL utuh tidak disentuh).
 *  Gagal (mis. file sudah tidak ada) = diabaikan agar hapus baris tetap jalan. */
function deleteDriveFile_(idOrUrl) {
  try {
    var raw = String(idOrUrl || '').trim();
    if (!/^[A-Za-z0-9_-]{10,}$/.test(raw)) return false;
    DriveApp.getFileById(raw).setTrashed(true);
    return true;
  } catch (e) {
    return false;
  }
}

/* ---------------- baca (GET) ---------------- */

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var a = p.action || 'ping';
    if (a === 'ping') return out_({ ok: true, time: iso_() });

    if (a === 'ticketsPublic') {
      var h = headerOf_(T_TICKETS);
      var list = data_(T_TICKETS).map(function (r) { return obj_(h, r); })
        .filter(function (t) { return bool_(t.is_published); })
        .map(function (t) { return ({
          kode: t.kode, nama: maskNama_(t.nama), skpk: t.skpk,
          jenis_layanan: t.jenis_layanan, nama_paket: t.nama_paket,
          status: t.status, ringkasan: t.ringkasan,
          created_at: t.created_at, updated_at: t.updated_at
        }); });
      return out_({ ok: true, tickets: list });
    }

    if (a === 'verifyTicket') {
      var f = find_(T_TICKETS, 'kode', p.kode || '');
      if (!f) return out_(fail_(404, 'Kode tiket tidak ditemukan.'));
      if (last4_(f.o.wa) !== String(p.digits || '') && last4_(f.o.nip) !== String(p.digits || '')) {
        return out_(fail_(403, '4 digit verifikasi tidak cocok.'));
      }
      return out_({ ok: true, ticket: f.o, replies: repliesFor_(f.o.kode) });
    }

    if (a === 'settings') return out_({ ok: true, settings: settingsAll_() });
    if (a === 'docs') return out_({ ok: true, docs: docsAll_() });

    // --- butuh sesi petugas ---
    var sess = me_(p.session);
    if (a === 'ticketsAdmin') {
      if (!sess) return out_(fail_(401, 'Sesi petugas diperlukan.'));
      var hh = headerOf_(T_TICKETS);
      var rows = data_(T_TICKETS).map(function (r) { return obj_(hh, r); });
      if (sess.role !== 'admin' && sess.layanan) {
        rows = rows.filter(function (t) { return t.jenis_layanan === sess.layanan; });
      }
      return out_({ ok: true, tickets: rows });
    }
    if (a === 'ticketAdmin') {
      if (!sess) return out_(fail_(401, 'Sesi petugas diperlukan.'));
      var t = find_(T_TICKETS, 'kode', p.kode || '');
      if (!t) return out_(fail_(404, 'Kode tiket tidak ditemukan.'));
      if (!scopeOk_(sess, t.o)) return out_(fail_(403, 'Di luar layanan Anda.'));
      return out_({ ok: true, ticket: t.o, replies: repliesFor_(t.o.kode) });
    }
    if (a === 'users') {
      needAdmin_(sess);
      var uh = headerOf_(T_USERS);
      var users = data_(T_USERS).map(function (r) {
        var u = obj_(uh, r);
        delete u.pass; // password tidak pernah dikirim ke frontend
        u.aktif = bool_(u.aktif);
        return u;
      });
      return out_({ ok: true, users: users });
    }
    return out_(fail_(400, 'action tidak dikenal: ' + a));
  } catch (err) {
    if (err && typeof err.code === 'number') return out_(err);
    return out_(fail_(500, String((err && err.message) || err)));
  }
}

function repliesFor_(kode) {
  var h = headerOf_(T_REPLIES);
  return data_(T_REPLIES).map(function (r) { return obj_(h, r); })
    .filter(function (r) { return String(r.ticket_kode).trim().toUpperCase() === String(kode).trim().toUpperCase(); });
}

function settingsAll_() {
  var o = {};
  data_(T_SETTINGS).forEach(function (r) { o[String(r[0])] = parseSettingsValue_(r[1]); });
  return o;
}

function docsAll_() {
  var h = headerOf_(T_DOCS);
  return data_(T_DOCS).map(function (r) { return obj_(h, r); });
}

/* ---------------- tulis (POST, body JSON) ---------------- */

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var a = body.action || '';

    if (a === 'login') {
      var s = login_(body.email, body.pass);
      if (!s) return out_(fail_(401, 'Email / password salah.'));
      if (s.disabled) return out_(fail_(403, 'Akun ini dinonaktifkan. Hubungi admin.'));
      return out_({ ok: true, session: s });
    }

    if (a === 'createTicket') return out_(createTicket_(body.ticket || {}));
    if (a === 'uploadFile') return out_(uploadFile_(body));
    if (a === 'addReplyPemohon') return out_(addReplyPemohon_(body));

    // --- mulai sini wajib sesi petugas ---
    var sess = me_(body.session);
    if (!sess) return out_(fail_(401, 'Sesi petugas diperlukan.'));

    if (a === 'petugasReply') return out_(petugasReply_(sess, body));
    if (a === 'updateTicket') return out_(updateTicket_(sess, body));
    if (a === 'deleteTicket') return out_(deleteTicket_(sess, body));
    if (a === 'createUser') { needAdmin_(sess); return out_(createUser_(body.user || {})); }
    if (a === 'updateUser') { needAdmin_(sess); return out_(updateUser_(body)); }
    if (a === 'deleteUser') { needAdmin_(sess); return out_(deleteUser_(body)); }
    if (a === 'saveSettings') { needAdmin_(sess); return out_(saveSettings_(body.settings || {})); }
    if (a === 'addDoc') { needAdmin_(sess); return out_(addDoc_(body.doc || {})); }
    if (a === 'updateDoc') { needAdmin_(sess); return out_(updateDoc_(body)); }
    if (a === 'deleteDoc') { needAdmin_(sess); return out_(deleteDoc_(body)); }
    return out_(fail_(400, 'action tidak dikenal: ' + a));
  } catch (err) {
    if (err && typeof err.code === 'number') return out_(err);
    return out_(fail_(500, String((err && err.message) || err)));
  }
}

/* ----- tiket: publik ----- */

function prefixFor_(jenis) {
  var m = (KODE_PREFIX[jenis] || '').toUpperCase();
  if (m) return m;
  var words = String(jenis || '').trim().split(/\s+/).filter(function (w) { return w; });
  return (words.slice(0, 2).map(function (w) { return w[0]; }).join('') || 'XX').toUpperCase();
}

function nextKode_(prefix) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var f = find_(T_COUNTERS, 'prefix', prefix);
    var sh = sheet_(T_COUNTERS);
    var n;
    if (!f) {
      // prefix layanan kustom baru
      var h = headerOf_(T_COUNTERS);
      n = 1;
      sh.appendRow([prefix, n]);
    } else {
      n = parseInt(f.o.last_number, 10) + 1 || 1;
      var ci = headerOf_(T_COUNTERS).indexOf('last_number') + 1;
      sh.getRange(f.row, ci).setValue(n);
    }
    return prefix + '-' + String(n).padStart(5, '0');
  } finally {
    lock.releaseLock();
  }
}

function createTicket_(t) {
  if (!t.nama || String(t.nama).trim().length < 3) throw fail_(400, 'Nama minimal 3 karakter.');
  if (!/^\d{16,18}$/.test(digits_(t.nip))) throw fail_(400, 'NIP/NIK harus 16–18 digit angka.');
  if (!/^(\+62|08)\d{8,13}$/.test(String(t.wa || ''))) throw fail_(400, 'Format WA: 08… / +62…');
  if (!t.jenisLayanan) throw fail_(400, 'Pilih jenis layanan.');
  if (!t.uraian || String(t.uraian).length < 50) throw fail_(400, 'Uraian minimal 50 karakter.');
  if (!t.pertanyaan || String(t.pertanyaan).trim().length < 10) throw fail_(400, 'Tulis pertanyaan yang diharapkan.');
  if (!t.bentuk) throw fail_(400, 'Pilih bentuk konsultasi.');
  var kode = nextKode_(prefixFor_(t.jenisLayanan));
  // lampiran inline: disimpan dengan nama = nomor tiket (hapus race upload-yatim)
  var fileName = '', fileDriveId = '';
  if (t.file) {
    var up = saveUpload_(kode + extFor_(t.file.filename, t.file.mime), t.file.mime, t.file.base64);
    fileName = safeName_(t.file.filename, kode + extFor_(t.file.filename, t.file.mime));
    fileDriveId = up.getId();
  }
  var now = iso_();
  sheet_(T_TICKETS).appendRow([kode, t.nama, digits_(t.nip), t.jabatan || '', t.skpk || '', String(t.wa),
    t.jenisLayanan, t.tahapan || '', t.metode || '', t.namaPaket || '', String(t.nilai || ''),
    t.uraian, t.pertanyaan, t.bentuk, fileName, fileDriveId,
    'Dalam Proses', '', true, true, now, now]);
  return { ok: true, kode: kode };
}

function addReplyPemohon_(b) {
  var f = find_(T_TICKETS, 'kode', b.kode || '');
  if (!f) throw fail_(404, 'Kode tiket tidak ditemukan.');
  if (last4_(f.o.wa) !== String(b.digits || '') && last4_(f.o.nip) !== String(b.digits || '')) {
    throw fail_(403, '4 digit verifikasi tidak cocok.');
  }
  if (!b.teks || String(b.teks).trim().length < 1) throw fail_(400, 'Pesan kosong.');
  var now = iso_();
  sheet_(T_REPLIES).appendRow([uid_(), f.o.kode, 'pemohon', String(b.teks).trim(), now]);
  // pertanyaan lanjutan → kembali Dalam Proses + flag tindak lanjut (mirror store.ts)
  var patch = { updated_at: now, menunggu_petugas: true };
  if (f.o.status === 'Selesai') patch.status = 'Dalam Proses';
  applyTicketPatch_(f, patch);
  return { ok: true };
}

/* ----- tiket: petugas ----- */

function applyTicketPatch_(found, patch) {
  var h = headerOf_(T_TICKETS);
  var row = [];
  for (var i = 0; i < h.length; i++) {
    var k = h[i];
    row.push(k in patch ? patch[k] : found.o[k]);
  }
  sheet_(T_TICKETS).getRange(found.row, 1, 1, h.length).setValues([row]);
}

function petugasReply_(sess, b) {
  var f = find_(T_TICKETS, 'kode', b.kode || '');
  if (!f) throw fail_(404, 'Kode tiket tidak ditemukan.');
  if (!scopeOk_(sess, f.o)) throw fail_(403, 'Di luar layanan Anda.');
  if (!b.teks || String(b.teks).trim().length < 5) throw fail_(400, 'Balasan minimal 5 karakter.');
  var now = iso_();
  sheet_(T_REPLIES).appendRow([uid_(), f.o.kode, 'petugas', String(b.teks).trim(), now]);
  var patch = { updated_at: now, menunggu_petugas: false };
  if (b.status) patch.status = b.status;
  if (b.ringkasan !== undefined) patch.ringkasan = b.ringkasan;
  else if (!f.o.ringkasan) patch.ringkasan = String(b.teks).slice(0, 260);
  if (patch.status === 'Selesai') patch.menunggu_petugas = false;
  applyTicketPatch_(f, patch);
  return { ok: true };
}

function updateTicket_(sess, b) {
  var f = find_(T_TICKETS, 'kode', b.kode || '');
  if (!f) throw fail_(404, 'Kode tiket tidak ditemukan.');
  if (!scopeOk_(sess, f.o)) throw fail_(403, 'Di luar layanan Anda.');
  var p = b.patch || {};
  var patch = { updated_at: iso_() };
  if (p.status) patch.status = p.status;
  if (p.is_published !== undefined) patch.is_published = !!p.is_published;
  if (p.ringkasan !== undefined) patch.ringkasan = p.ringkasan;
  if (patch.status === 'Selesai') patch.menunggu_petugas = false;
  applyTicketPatch_(f, patch);
  return { ok: true };
}

function deleteTicket_(sess, b) {
  var f = find_(T_TICKETS, 'kode', b.kode || '');
  if (!f) throw fail_(404, 'Kode tiket tidak ditemukan.');
  if (!scopeOk_(sess, f.o)) throw fail_(403, 'Di luar layanan Anda.');
  deleteDriveFile_(f.o.file_drive_id);
  sheet_(T_TICKETS).deleteRow(f.row);
  // hapus balasan terkait (dari bawah agar indeks aman)
  var h = headerOf_(T_REPLIES);
  var ci = h.indexOf('ticket_kode');
  var rows = data_(T_REPLIES);
  for (var i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i][ci]).trim().toUpperCase() === String(f.o.kode).trim().toUpperCase()) {
      sheet_(T_REPLIES).deleteRow(i + 2);
    }
  }
  return { ok: true };
}

/* ----- users (admin) ----- */

function createUser_(u) {
  if (!u.nama || String(u.nama).trim().length < 3) throw fail_(400, 'Nama minimal 3 karakter.');
  if (!/^\S+@\S+\.\S+$/.test(String(u.email || '').trim())) throw fail_(400, 'Email tidak valid.');
  if (!u.pass || String(u.pass).length < 6) throw fail_(400, 'Password minimal 6 karakter.');
  if (find_(T_USERS, 'email', u.email)) throw fail_(400, 'Email sudah terdaftar.');
  var role = u.role === 'admin' ? 'admin' : 'tim';
  sheet_(T_USERS).appendRow([uid_(), String(u.email).trim(), String(u.pass), String(u.nama).trim(), role, role === 'tim' ? (u.layanan || '') : '', true]);
  return { ok: true };
}

function updateUser_(b) {
  var h = headerOf_(T_USERS);
  var rows = data_(T_USERS);
  var idx = -1;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][h.indexOf('id')]) === String(b.id)) { idx = i; break; }
  }
  if (idx < 0) throw fail_(404, 'User tidak ditemukan.');
  var r = rows[idx].slice();
  function set(k, v) { r[h.indexOf(k)] = v; }
  if (b.patch.nama !== undefined) {
    if (String(b.patch.nama).trim().length < 3) throw fail_(400, 'Nama minimal 3 karakter.');
    set('nama', String(b.patch.nama).trim());
  }
  if (b.patch.email !== undefined) {
    if (!/^\S+@\S+\.\S+$/.test(String(b.patch.email).trim())) throw fail_(400, 'Email tidak valid.');
    set('email', String(b.patch.email).trim());
  }
  if (b.patch.pass) {
    if (String(b.patch.pass).length < 6) throw fail_(400, 'Password minimal 6 karakter.');
    set('pass', String(b.patch.pass));
  }
  if (b.patch.role) set('role', b.patch.role === 'admin' ? 'admin' : 'tim');
  if (b.patch.layanan !== undefined) set('layanan', b.patch.role === 'admin' ? '' : (b.patch.layanan || ''));
  else if (b.patch.role === 'admin') set('layanan', '');
  if (b.patch.aktif !== undefined) set('aktif', !!b.patch.aktif);
  sheet_(T_USERS).getRange(idx + 2, 1, 1, h.length).setValues([r]);
  return { ok: true };
}

function deleteUser_(b) {
  var h = headerOf_(T_USERS);
  var rows = data_(T_USERS);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][h.indexOf('id')]) === String(b.id)) {
      sheet_(T_USERS).deleteRow(i + 2);
      return { ok: true };
    }
  }
  throw fail_(404, 'User tidak ditemukan.');
}

/* ----- settings & docs (admin) ----- */

function saveSettings_(settings) {
  var sh = sheet_(T_SETTINGS);
  var rows = data_(T_SETTINGS);
  var skipped = [];
  Object.keys(settings).forEach(function (k) {
    if (k.charAt(0) === '_') return;
    var v = settings[k];
    if (v !== null && typeof v === 'object') v = JSON.stringify(v);
    if (String(v == null ? '' : v).length > 40000) { skipped.push(k); return; } // sel Sheets maks ~50rb karakter
    var done = false;
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i][0]) === k) { sh.getRange(i + 2, 2).setValue(v); rows[i][1] = v; done = true; break; }
    }
    if (!done) { sh.appendRow([k, v]); rows.push([k, v]); }
  });
  return { ok: true, skipped: skipped };
}

function addDoc_(d) {
  if (!d.judul || String(d.judul).trim().length < 3) throw fail_(400, 'Judul minimal 3 karakter.');
  var id = uid_();
  sheet_(T_DOCS).appendRow([id, String(d.judul).trim(), d.kategori || '', d.tag || d.kategori || '',
    d.desc || '', d.fileName || '', d.driveId || d.url || '', d.tipe || 'info', d.size || '', iso_()]);
  return { ok: true, id: id };
}

function updateDoc_(b) {
  var h = headerOf_(T_DOCS);
  var rows = data_(T_DOCS);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][h.indexOf('id')]) === String(b.id)) {
      var r = rows[i].slice();
      function set(k, v) { r[h.indexOf(k)] = v; }
      var p = b.patch || {};
      if (p.judul !== undefined) set('judul', p.judul);
      if (p.kategori !== undefined) { set('kategori', p.kategori); set('tag', p.kategori); }
      if (p.tag !== undefined) set('tag', p.tag);
      if (p.desc !== undefined) set('desc', p.desc);
      if (p.url !== undefined) set('drive_id_atau_url', p.url);
      if (p.driveId !== undefined) set('drive_id_atau_url', p.driveId);
      sheet_(T_DOCS).getRange(i + 2, 1, 1, h.length).setValues([r]);
      return { ok: true };
    }
  }
  throw fail_(404, 'Dokumen tidak ditemukan.');
}

function deleteDoc_(b) {
  var h = headerOf_(T_DOCS);
  var rows = data_(T_DOCS);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][h.indexOf('id')]) === String(b.id)) {
      if (rows[i][h.indexOf('tipe')] === 'file') deleteDriveFile_(rows[i][h.indexOf('drive_id_atau_url')]);
      sheet_(T_DOCS).deleteRow(i + 2);
      return { ok: true };
    }
  }
  throw fail_(404, 'Dokumen tidak ditemukan.');
}

/* ----- upload file → Drive ----- */

function extFor_(filename, mime) {
  var m = /\.([A-Za-z0-9]{1,5})$/.exec(String(filename || '').trim());
  if (m) return '.' + m[1].toLowerCase();
  if (mime === 'image/png') return '.png';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return '.jpg';
  return '.pdf';
}

function safeName_(name, fallback) {
  var s = String(name || fallback || 'file').replace(/[\\/:*?"<>|]/g, '-').trim().slice(0, 120);
  return s || fallback || 'file';
}

function saveUpload_(fileName, mime, base64) {
  if (!base64) throw fail_(400, 'File kosong.');
  if (String(base64).length > UPLOAD_MAX_B64) throw fail_(400, 'File terlalu besar (maks ~11MB).');
  mime = String(mime || '');
  if (MIME_OK.indexOf(mime) < 0) throw fail_(400, 'Hanya PDF / PNG / JPG.');
  var folder = DriveApp.getFolderById(props_().getProperty('UPLOAD_FOLDER_ID'));
  var blob = Utilities.newBlob(Utilities.base64Decode(String(base64).split(',').pop()), mime, safeName_(fileName, 'lampiran'));
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file;
}

function uploadFile_(b) {
  // b.name opsional: nama file kustom (dokumen/logo); default nama asli
  var file = saveUpload_(b.name || b.filename, b.mime, b.base64);
  return { ok: true, fileId: file.getId(), url: 'https://drive.google.com/file/d/' + file.getId() + '/view' };
}
