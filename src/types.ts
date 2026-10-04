export const LAYANAN = [
  "Pengadaan Barang",
  "Jasa Konstruksi",
  "Jasa Konsultansi",
  "Jasa Lainnya",
  "Pasca Kontrak",
] as const;
export type Layanan = (typeof LAYANAN)[number];

export const TAHAPAN = [
  "Perencanaan",
  "Persiapan",
  "Pemilihan",
  "Pelaksanaan",
  "Pasca Kontrak",
] as const;

export const METODE = [
  "E-Purchasing",
  "Tender",
  "Tender Cepat",
  "Seleksi",
  "Pengadaan Langsung",
  "Penunjukan Langsung",
  "Swakelola",
] as const;

export type StatusTiket = "Dalam Proses" | "Selesai" | "Perlu Klarifikasi";
export const BENTUK_KONSULTASI = [
  "Konsultasi melalui WhatsApp",
  "Konsultasi tatap muka",
  "Konsultasi melalui video conference",
  "Jawaban/penjelasan tertulis",
] as const;
export type BentukKonsultasi = (typeof BENTUK_KONSULTASI)[number];

export interface Reply {
  id: string;
  dari: "petugas" | "pemohon";
  teks: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  kode: string;
  nama: string;
  nip: string;
  jabatan: string;
  skpk: string;
  wa: string;
  jenisLayanan: string;
  tahapan: string;
  metode: string;
  namaPaket: string;
  nilai?: string;
  uraian: string;
  pertanyaan: string;
  bentuk: BentukKonsultasi;
  fileName?: string;
  status: StatusTiket;
  jawaban: Reply[];
  ringkasan?: string;
  isPublished: boolean;
  createdAt: string;
  /** aktivitas terakhir (balasan / perubahan status) */
  updatedAt: string;
  /** true bila ada hal baru dari pemohon yang menunggu respons petugas */
  menungguPetugas?: boolean;
}

export interface AdminUser {
  id?: string;
  email: string;
  pass: string;
  nama: string;
  role: "admin" | "operator";
  aktif?: boolean;
}
