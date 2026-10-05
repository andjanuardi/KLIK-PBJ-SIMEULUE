import seed from "../data/data-seed.json";
import type { AdminUser } from "../types";

/**
 * Akses data kanonis data-seed.json — modul daun, TANPA impor dari
 * store/types/referensi agar tidak ada siklus impor.
 * Ubah datanya di JSON, bukan di sini.
 */

export const SEED_ADMINS: AdminUser[] = (seed as { admins?: AdminUser[] }).admins as AdminUser[];

interface SeedReferensi {
  layanan?: string[];
  tahapan?: string[];
  metode?: string[];
  bentukKonsultasi?: string[];
  skpk?: string[];
  jabatan?: string[];
}
const _ref = (seed as { referensi?: SeedReferensi }).referensi ?? {};
function _list(v: string[] | undefined, fallback: string[]): string[] {
  return Array.isArray(v) && v.length > 0 ? v : fallback;
}
export const SEED_LAYANAN: string[] = _list(_ref.layanan, [
  "Pengadaan Barang",
  "Jasa Konstruksi",
  "Jasa Konsultansi",
  "Jasa Lainnya",
  "Pasca Kontrak",
]);
export const SEED_TAHAPAN: string[] = _list(_ref.tahapan, [
  "Perencanaan",
  "Persiapan",
  "Pemilihan",
  "Pelaksanaan",
  "Pasca Kontrak",
]);
export const SEED_METODE: string[] = _list(_ref.metode, [
  "E-Purchasing",
  "Tender",
  "Tender Cepat",
  "Seleksi",
  "Pengadaan Langsung",
  "Penunjukan Langsung",
  "Swakelola",
]);
export const SEED_BENTUK_KONSULTASI: string[] = _list(_ref.bentukKonsultasi, [
  "Jawaban/penjelasan tertulis",
  "Konsultasi melalui WhatsApp",
  "Konsultasi tatap muka",
  "Konsultasi melalui video conference",
]);
export const SEED_SKPK: string[] = _list(_ref.skpk, ["Sekretariat Daerah"]);
export const SEED_JABATAN: string[] = _list(_ref.jabatan, ["PPK", "Lainnya"]);

/** Awalan kode tiket per jenis layanan — sumber tunggal: data-seed.json `referensi.kodePrefix`. */
export const SEED_KODE_PREFIX: Record<string, string> =
  (seed as { referensi?: { kodePrefix?: Record<string, string> } }).referensi?.kodePrefix ?? {};

/** Pengaturan awal dashboard — sumber tunggal: data-seed.json `settings`. */
export const SEED_SETTINGS: Record<string, unknown> =
  (seed as { settings?: Record<string, unknown> }).settings ?? {};

/** Dokumen awal — sumber tunggal: data-seed.json `docs` (`createdDaysAgo` → ISO saat load). */
export interface SeedDoc {
  id: string;
  judul: string;
  kategori: string;
  tag: string;
  desc: string;
  fileName?: string;
  dataUrl?: string;
  url?: string;
  tipe?: "file" | "url" | "info";
  size?: string;
  createdDaysAgo?: number;
}
export const SEED_DOCS: SeedDoc[] = (
  (seed as { docs?: SeedDoc[] }).docs ?? []
).filter((d) => d && d.id && d.judul);

/** Konversi `createdDaysAgo` seed → ISO (offset hari dihitung saat load agar selalu segar). */
export function seedDaysAgo(n: number): string {
  const d = new Date();
  const days = Number.isFinite(n) && (n as number) >= 0 ? (n as number) : 0;
  d.setDate(d.getDate() - days);
  d.setHours(9 + (days % 8), 12, 0, 0);
  return d.toISOString();
}
