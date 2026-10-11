/**********************************************************************
 * KLIK-PBJ SIMEULUE — Generator data dummy (20 tiket contoh)
 *
 * Prasyarat: `setup_klikpbj` dari Setup.gs sudah pernah dijalankan
 * (tab Tickets/Replies/Counters sudah ada). File ini mandiri:
 * tidak butuh fungsi dari file .gs lain.
 *
 * Cara pakai:
 *  - Isi contoh: pilih fungsi `seed_dummy` > Run.
 *  - Hapus contoh: pilih fungsi `clear_dummy` > Run (minta konfirmasi dulu).
 * Guard seed: ABORT bila tab Tickets sudah berisi data (anti-duplikat).
 * `clear_dummy` hanya menyentuh Tickets/Replies/Counters + file Drive
 * lampiran tiket; Users/Settings/Docs TIDAK dihapus (konfigurasi).
 **********************************************************************/

var D_NAMA = ['Ahmad Fauzi', 'Siti Rahma', 'Budi Santoso', 'Dewi Lestari', 'Andri Pratama', 'Rina Marlina', 'Yusuf Hidayat', 'Nina Kurnia', 'Tamsil Anwar', 'Fitri Handayani'];
var D_SKPK = ['Dinas Pendidikan', 'Dinas Kesehatan', 'Dinas PUPR', 'RSUD Kota', 'Bappeda', 'Dinas Sosial', 'Sekretariat Daerah', 'Dinas Perhubungan'];
var D_PAKET = ['Pengadaan Laptop Sekolah Dasar', 'Pembangunan Jalan Lingkungan', 'Jasa Konsultansi Perencanaan Gedung', 'Pengadaan Obat Puskesmas', 'Belanja ATK Sekretariat', 'Rehabilitasi Jembatan Desa', 'Pengawasan Proyek Drainase', 'Pengadaan Ambulans RSUD', 'Jasa Kebersihan Kantor', 'Pemeliharaan Jaringan Irigasi'];
var D_LAYANAN = ['Pengadaan Barang', 'Jasa Konstruksi', 'Jasa Konsultansi', 'Jasa Lainnya', 'Pasca Kontrak'];
var D_PREFIX = { 'Pengadaan Barang': 'PB', 'Jasa Konstruksi': 'JK', 'Jasa Konsultansi': 'JT', 'Jasa Lainnya': 'JL', 'Pasca Kontrak': 'PK' };
var D_TAHAPAN = ['Perencanaan', 'Persiapan', 'Pemilihan', 'Pelaksanaan', 'Pasca Kontrak'];
var D_METODE = ['E-Purchasing', 'Tender', 'Seleksi', 'Pengadaan Langsung', 'Penunjukan Langsung'];
var D_BENTUK = ['Jawaban/penjelasan tertulis', 'Konsultasi melalui WhatsApp', 'Konsultasi tatap muka', 'Konsultasi melalui video conference'];
var D_JABATAN = ['PPK', 'PPTK', 'Bendahara', 'Kasubbag Umum', 'Staf Pengadaan'];
var D_URAIAN = 'Kami mengalami kendala pada tahap pemilihan penyedia karena terdapat perbedaan interpretasi spesifikasi teknis pada dokumen pengadaan. Mohon arahan langkah yang tepat agar proses tetap sesuai ketentuan Perpres 16/2018 beserta perubahannya dan tidak menimbulkan temuan audit di kemudian hari. ';
var D_JAWABAN = 'Terima kasih atas konsultasinya. Berdasarkan ketentuan Perpres 16 Tahun 2018 jo. Perpres 12 Tahun 2021, Pokja dapat melakukan klarifikasi teknis melalui SPSE sebelum penetapan pemenang. Pastikan adendum terdokumentasi dalam berita acara dan HPS telah direviu. Jika nilai di atas Rp200 juta untuk barang, gunakan Tender; di bawah itu Pengadaan Langsung dengan minimal 2 penawaran pembanding.';

function seedDaysAgoIso_(n) {
  var d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9 + (n % 8), 12, 0, 0);
  return d.toISOString();
}

function seedUid_() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 12);
}

function seed_dummy() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tickets = ss.getSheetByName('Tickets');
  var replies = ss.getSheetByName('Replies');
  var counters = ss.getSheetByName('Counters');
  if (!tickets || !replies || !counters) throw new Error('Tab belum ada — jalankan setup_klikpbj dulu.');
  if (tickets.getLastRow() > 1) {
    Logger.log('ABORT: Tickets sudah berisi ' + (tickets.getLastRow() - 1) + ' baris. Hapus manual bila ingin reseed.');
    return;
  }
  // nomor lanjut dari Counters yang ada
  var seq = { 'Pengadaan Barang': 0, 'Jasa Konstruksi': 0, 'Jasa Konsultansi': 0, 'Jasa Lainnya': 0, 'Pasca Kontrak': 0 };
  if (counters.getLastRow() > 1) {
    var cRows = counters.getRange(2, 1, counters.getLastRow() - 1, 2).getValues();
    for (var c = 0; c < cRows.length; c++) {
      for (var L in seq) {
        if (D_PREFIX[L] === String(cRows[c][0]).trim().toUpperCase()) seq[L] = parseInt(cRows[c][1], 10) || 0;
      }
    }
  }
  function nextKode(jenis) {
    seq[jenis]++;
    return D_PREFIX[jenis] + '-' + String(seq[jenis]).padStart(5, '0');
  }
  var made = 0;
  function addTicket(o) {
    var kode = nextKode(o.jenis);
    var now = seedDaysAgoIso_(o.updatedAgo);
    tickets.appendRow([kode, o.nama, o.nip, o.jabatan, o.skpk, o.wa, o.jenis,
      o.tahapan, o.metode, o.paket, o.nilai, o.uraian, o.pertanyaan, o.bentuk,
      '', '', o.status, o.ringkasan, true, o.menunggu, seedDaysAgoIso_(o.createdAgo), now]);
    if (o.jawabAgo !== undefined) {
      replies.appendRow([seedUid_(), kode, 'petugas', D_JAWABAN, seedDaysAgoIso_(o.jawabAgo)]);
    }
    made++;
  }
  var i, k;
  for (i = 0; i < 10; i++) {
    var selesai = i % 3 !== 0;
    addTicket({
      nama: D_NAMA[i], nip: ('19820' + ((i % 9) + 1) + '0' + ((i * 37) % 10) + '12345678').slice(0, 18),
      jabatan: D_JABATAN[i % 5], skpk: D_SKPK[i % D_SKPK.length], wa: '08123456' + String(7890 + i * 11).slice(-4),
      jenis: D_LAYANAN[i % 5], tahapan: D_TAHAPAN[i % 5], metode: D_METODE[i % 5],
      paket: D_PAKET[i % D_PAKET.length], nilai: String(150000000 + i * 275000000),
      uraian: D_URAIAN + 'Konteks paket: ' + D_PAKET[i % D_PAKET.length] + '.',
      pertanyaan: 'Apakah langkah klarifikasi tersebut diperbolehkan dan bagaimana format berita acaranya?',
      bentuk: D_BENTUK[i % 4], status: selesai ? 'Selesai' : (i % 2 === 0 ? 'Dalam Proses' : 'Perlu Klarifikasi'),
      jawabAgo: selesai ? Math.max(0, i - 1) : undefined,
      ringkasan: selesai ? D_JAWABAN.slice(0, 220) + '...' : '',
      createdAgo: i, updatedAgo: selesai ? Math.max(0, i - 1) : i, menunggu: !selesai
    });
  }
  for (k = 0; k < 10; k++) {
    var sel = k % 2 === 0;
    addTicket({
      nama: D_NAMA[(k * 3) % D_NAMA.length], nip: ('19910' + k + '0712345678').slice(0, 18),
      jabatan: 'PPK', skpk: D_SKPK[(k * 2) % D_SKPK.length], wa: '08214567' + String(1000 + k * 33).slice(-4),
      jenis: D_LAYANAN[k % 5], tahapan: 'Pemilihan', metode: 'Tender',
      paket: D_PAKET[(k * 2) % D_PAKET.length], nilai: '',
      uraian: D_URAIAN,
      pertanyaan: 'Mohon panduan evaluasi penawaran harga terendah namun spesifikasi berbeda.',
      bentuk: 'Jawaban/penjelasan tertulis', status: sel ? 'Selesai' : 'Dalam Proses',
      jawabAgo: sel ? k : undefined,
      ringkasan: sel ? D_JAWABAN.slice(0, 200) + '...' : '',
      createdAgo: k + 10, updatedAgo: sel ? k : k + 10, menunggu: !sel
    });
  }
  // selaraskan Counters
  var cRows2 = counters.getLastRow() > 1 ? counters.getRange(2, 1, counters.getLastRow() - 1, 2).getValues() : [];
  for (var L2 in seq) {
    var done = false;
    for (var c2 = 0; c2 < cRows2.length; c2++) {
      if (D_PREFIX[L2] === String(cRows2[c2][0]).trim().toUpperCase()) {
        counters.getRange(c2 + 2, 2).setValue(Math.max(parseInt(cRows2[c2][1], 10) || 0, seq[L2]));
        done = true; break;
      }
    }
    if (!done) counters.appendRow([D_PREFIX[L2], seq[L2]]);
  }
  Logger.log('OK seed_dummy: ' + made + ' tiket. Nomor per prefix: ' + JSON.stringify(seq));
}

/** Hapus SEMUA data contoh (Tickets + Replies), reset Counters ke 0.
 *  Minta konfirmasi Yes/No dulu. Users/Settings/Docs tidak disentuh. */
function clear_dummy() {
  var ui;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    throw new Error('ABORT: konfirmasi tidak tersedia — jalankan manual dari editor.');
  }
  var ans = ui.alert('Hapus data dummy?', 'Seluruh baris Tickets + Replies akan dihapus dan Counters direset ke 0. Lanjutkan?', ui.ButtonSet.YES_NO);
  if (ans !== ui.Button.YES) {
    Logger.log('ABORT: dibatalkan pengguna.');
    return;
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tickets = ss.getSheetByName('Tickets');
  var replies = ss.getSheetByName('Replies');
  var counters = ss.getSheetByName('Counters');
  if (!tickets || !replies || !counters) throw new Error('Tab belum ada — jalankan setup_klikpbj dulu.');
  // kumpulkan file Drive lampiran tiket untuk dibuang ke Trash
  var fileIds = [];
  if (tickets.getLastRow() > 1) {
    var tRows = tickets.getRange(2, 1, tickets.getLastRow() - 1, tickets.getLastColumn()).getValues();
    var h = tickets.getRange(1, 1, 1, tickets.getLastColumn()).getValues()[0];
    var ci = h.indexOf('file_drive_id');
    for (var i = 0; i < tRows.length; i++) {
      var fid = ci >= 0 ? String(tRows[i][ci] || '').trim() : '';
      if (/^[A-Za-z0-9_-]{10,}$/.test(fid)) fileIds.push(fid);
    }
    tickets.deleteRows(2, tickets.getLastRow() - 1);
  }
  if (replies.getLastRow() > 1) replies.deleteRows(2, replies.getLastRow() - 1);
  if (counters.getLastRow() > 1) {
    counters.getRange(2, 2, counters.getLastRow() - 1, 1).setValue(0);
  }
  var trashed = 0;
  for (var f = 0; f < fileIds.length; f++) {
    try {
      DriveApp.getFileById(fileIds[f]).setTrashed(true);
      trashed++;
    } catch (e) { /* file sudah tidak ada — abaikan */ }
  }
  Logger.log('OK clear_dummy: tiket+balasan dihapus, Counters=0, file Drive dibuang ke Trash: ' + trashed + '.');
}
