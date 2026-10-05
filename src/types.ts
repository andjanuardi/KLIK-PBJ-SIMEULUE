import { SEED_BENTUK_KONSULTASI, SEED_LAYANAN, SEED_METODE, SEED_TAHAPAN } from "./lib/seed-data";

/**
 * Nilai kanonis dari data-seed.json `referensi` (via lib/seed-data, modul daun
 * tanpa siklus impor). Tetap tuple agar cocok dengan `z.enum`.
 */
export const LAYANAN = SEED_LAYANAN as unknown as readonly [string, ...string[]];
export type Layanan = (typeof LAYANAN)[number];

export const TAHAPAN = SEED_TAHAPAN as unknown as readonly [string, ...string[]];

export const METODE = SEED_METODE as unknown as readonly [string, ...string[]];

export type StatusTiket = "Dalam Proses" | "Selesai" | "Perlu Klarifikasi";
export const BENTUK_KONSULTASI = SEED_BENTUK_KONSULTASI as unknown as readonly [string, ...string[]];
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
  role: "admin" | "tim";
  /** scope layanan untuk role "tim" (tampil sebagai "Tim <layanan>"); kosong = semua layanan (legacy) */
  layanan?: string;
  aktif?: boolean;
}
