// Generator data-seed.json — regen tiket dummy via bun. Blok non-tiket
// (admins, referensi, settings, docs, jawabanStandar) dipertahankan dari file
// yang sudah ada agar perubahan data manual tidak hilang.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const SKPK = [
  "Dinas Pendidikan",
  "Dinas Kesehatan",
  "Dinas PUPR",
  "RSUD Kota",
  "Bappeda",
  "Dinas Sosial",
  "Sekretariat Daerah",
  "Dinas Perhubungan",
];
const NAMA = ["Ahmad Fauzi", "Siti Rahma", "Budi Santoso", "Dewi Lestari", "Andri Pratama", "Rina Marlina", "Yusuf Hidayat", "Nina Kurnia", "Tamsil Anwar", "Fitri Handayani"];
const PAKET = [
  "Pengadaan Laptop Sekolah Dasar",
  "Pembangunan Jalan Lingkungan",
  "Jasa Konsultansi Perencanaan Gedung",
  "Pengadaan Obat Puskesmas",
  "Belanja ATK Sekretariat",
  "Rehabilitasi Jembatan Desa",
  "Pengawasan Proyek Drainase",
  "Pengadaan Ambulans RSUD",
  "Jasa Kebersihan Kantor",
  "Pemeliharaan Jaringan Irigasi",
];
const LAYANAN = ["Pengadaan Barang", "Jasa Konstruksi", "Jasa Konsultansi", "Jasa Lainnya", "Pasca Kontrak"];
const PREFIX = { "Pengadaan Barang": "PB", "Jasa Konstruksi": "JK", "Jasa Konsultansi": "JT", "Jasa Lainnya": "JL", "Pasca Kontrak": "PK" };
const _seq = {};
function nextKode(jenis) {
  _seq[jenis] = (_seq[jenis] ?? 0) + 1;
  return `${PREFIX[jenis]}-${String(_seq[jenis]).padStart(5, "0")}`;
}
const BENTUK4 = ["Jawaban/penjelasan tertulis", "Konsultasi melalui WhatsApp", "Konsultasi tatap muka", "Konsultasi melalui video conference"];
const URAIAN =
  "Kami mengalami kendala pada tahap pemilihan penyedia karena terdapat perbedaan interpretasi spesifikasi teknis pada dokumen pengadaan. Mohon arahan langkah yang tepat agar proses tetap sesuai ketentuan Perpres 16/2018 beserta perubahannya dan tidak menimbulkan temuan audit di kemudian hari. ";
const JAWABAN =
  "Terima kasih atas konsultasinya. Berdasarkan ketentuan Perpres 16 Tahun 2018 jo. Perpres 12 Tahun 2021, Pokja dapat melakukan klarifikasi teknis melalui SPSE sebelum penetapan pemenang. Pastikan adendum terdokumentasi dalam berita acara dan HPS telah direviu. Jika nilai di atas Rp200 juta untuk barang, gunakan Tender; di bawah itu Pengadaan Langsung dengan minimal 2 penawaran pembanding.";

const tickets = NAMA.map((nama, i) => {
  const selesai = i % 3 !== 0;
  const jenisLayanan = LAYANAN[i % LAYANAN.length];
  return {
    id: `seed-${i}`,
    kode: nextKode(jenisLayanan),
    nama,
    nip: `19820${(i % 9) + 1}0${(i * 37) % 10}12345678`.slice(0, 18),
    jabatan: ["PPK", "PPTK", "Bendahara", "Kasubbag Umum", "Staf Pengadaan"][i % 5],
    skpk: SKPK[i % SKPK.length],
    wa: `08123456${String(7890 + i * 11).slice(-4)}`,
    jenisLayanan: LAYANAN[i % LAYANAN.length],
    tahapan: ["Perencanaan", "Persiapan", "Pemilihan", "Pelaksanaan", "Pasca Kontrak"][i % 5],
    metode: ["E-Purchasing", "Tender", "Seleksi", "Pengadaan Langsung", "Penunjukan Langsung"][i % 5],
    namaPaket: PAKET[i % PAKET.length],
    nilai: String(150_000_000 + i * 275_000_000),
    uraian: URAIAN + `Konteks paket: ${PAKET[i % PAKET.length]}.`,
    pertanyaan: "Apakah langkah klarifikasi tersebut diperbolehkan dan bagaimana format berita acaranya?",
    bentuk: BENTUK4[i % 4],
    status: selesai ? "Selesai" : i % 2 === 0 ? "Dalam Proses" : "Perlu Klarifikasi",
    jawaban: selesai ? [{ id: `seed-r-${i}`, dari: "petugas", teks: "JAWABAN_REF", replyDaysAgo: Math.max(0, i - 1) }] : [],
    ringkasanDaysAgo: selesai ? Math.max(0, i - 1) : undefined,
    isPublished: true,
    createdDaysAgo: i,
    updatedDaysAgo: selesai ? Math.max(0, i - 1) : i,
    menungguPetugas: !selesai,
  };
});
for (let k = 0; k < 10; k++) {
  const i = k + 10;
  const selesai = k % 2 === 0;
  tickets.push({
    id: `seed-x-${k}`,
    kode: nextKode(LAYANAN[k % LAYANAN.length]),
    nama: NAMA[(k * 3) % NAMA.length],
    nip: `19910${k}0712345678`.slice(0, 18),
    jabatan: "PPK",
    skpk: SKPK[(k * 2) % SKPK.length],
    wa: `08214567${String(1000 + k * 33).slice(-4)}`,
    jenisLayanan: LAYANAN[k % LAYANAN.length],
    tahapan: "Pemilihan",
    metode: "Tender",
    namaPaket: PAKET[(k * 2) % PAKET.length],
    uraian: URAIAN,
    pertanyaan: "Mohon panduan evaluasi penawaran harga terendah namun spesifikasi berbeda.",
    bentuk: "Jawaban/penjelasan tertulis",
    status: selesai ? "Selesai" : "Dalam Proses",
    jawaban: selesai ? [{ id: `seed-rx-${k}`, dari: "petugas", teks: "JAWABAN_REF", replyDaysAgo: k }] : [],
    ringkasanDaysAgo: selesai ? k : undefined,
    isPublished: true,
    createdDaysAgo: i,
    updatedDaysAgo: selesai ? k : i,
    menungguPetugas: !selesai,
  });
}

const prev = existsSync("src/data/data-seed.json")
  ? JSON.parse(readFileSync("src/data/data-seed.json", "utf8"))
  : {};

const data = {
  _note: prev._note ?? "Data dummy KLIK-PBJ. Offset hari dihitung saat load agar selalu segar. JAWABAN_REF = teks jawaban standar.",
  jawabanStandar: prev.jawabanStandar ?? JAWABAN,
  ringkasanSuffix: prev.ringkasanSuffix ?? "...",
  admins: [
    { id: "u-seed-0", email: "admin@simeuluekab.go.id", pass: "admin123", nama: "Admin PBJ", role: "admin", aktif: true },
    { id: "u-seed-1", email: "tim-barang@simeuluekab.go.id", pass: "tim123", nama: "Tim Pengadaan Barang", role: "tim", layanan: "Pengadaan Barang", aktif: true },
    { id: "u-seed-2", email: "tim-konstruksi@simeuluekab.go.id", pass: "tim123", nama: "Tim Jasa Konstruksi", role: "tim", layanan: "Jasa Konstruksi", aktif: true },
    { id: "u-seed-3", email: "tim-konsultansi@simeuluekab.go.id", pass: "tim123", nama: "Tim Jasa Konsultansi", role: "tim", layanan: "Jasa Konsultansi", aktif: true },
    { id: "u-seed-4", email: "tim-lainnya@simeuluekab.go.id", pass: "tim123", nama: "Tim Jasa Lainnya", role: "tim", layanan: "Jasa Lainnya", aktif: true },
    { id: "u-seed-5", email: "tim-pascakontrak@simeuluekab.go.id", pass: "tim123", nama: "Tim Pasca Kontrak", role: "tim", layanan: "Pasca Kontrak", aktif: true },
  ],
  tickets,
  // blok data kanonis — hanya dibuat saat belum ada (jangan timpa manual edit)
  ...(prev.referensi ? { referensi: prev.referensi } : {}),
  ...(prev.settings ? { settings: prev.settings } : {}),
  ...(prev.docs ? { docs: prev.docs } : {}),
};

writeFileSync("src/data/data-seed.json", JSON.stringify(data, null, 2) + "\n");
console.log("wrote src/data/data-seed.json with", tickets.length, "tickets");
