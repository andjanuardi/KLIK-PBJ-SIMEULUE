/** Data layer: server Google Sheets via lib/api. File ini hanya menyimpan
 *  tipe, default tampilan, dan sesi login (localStorage). Draft form tetap lokal. */

// --- pengaturan dashboard ---
export interface SiteSettings {
  logoDataUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  /** blok teks bebas di bawah subjudul hero */
  infoText?: string;
  /** teks disclaimer berjalan (marquee bawah hero) */
  disclaimerText?: string;
  disclaimerAktif?: boolean;
  jamLayanan?: string;
  layananCustom: string[];
}
export const DEFAULT_SETTINGS: SiteSettings = {
  heroTitle: "KLIK-PBJ SIMEULUE",
  heroSubtitle: "Klinik Layanan Integrasi Konsultasi Pengadaan Barang dan Jasa",
  infoText: "Visi Kabupaten Simeulue Tahun 2030: Mewujudkan Simeulue yang bermartabat & pusat pertumbuhan ekonomi biru.",
  disclaimerText: "Tanggapan Tim KLIK-PBJ bersifat konsultatif dan merupakan bahan pertimbangan, berdasarkan informasi dan dokumen yang disampaikan pada saat konsultasi. Tanggapan ini tidak mengambil alih kewenangan maupun tanggung jawab pejabat yang berwenang. Pihak yang berkonsultasi dapat memiliki pendapat berbeda dan wajib memastikan keputusan yang diambil sesuai ketentuan peraturan perundang-undangan. Segala keputusan, tindakan, dan konsekuensi atas pelaksanaannya menjadi tanggung jawab pihak/pejabat yang berwenang.",
  disclaimerAktif: true,
  jamLayanan: "Senin–Jumat • 08.00–16.00 WIB",
  layananCustom: [],
};

// --- dokumen referensi ---
export interface DocItem {
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
  createdAt: string;
}

// --- sesi petugas (token dari login server, 12 jam) ---
export interface AdminSession {
  email: string;
  role: "admin" | "tim";
  nama: string;
  /** scope layanan untuk role "tim"; kosong = semua layanan (legacy) */
  layanan?: string;
  token?: string;
  at: string;
}
const SESSION_KEY = "klinik_pbj_admin_session_v1";

export function setAdminSession(s: Omit<AdminSession, "at">): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...s, at: new Date().toISOString() }));
}
export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s.email) return null;
    return {
      email: s.email,
      role: s.role === "tim" ? "tim" : "admin",
      nama: s.nama ?? "",
      layanan: s.layanan || undefined,
      token: s.token || undefined,
      at: s.at ?? "",
    };
  } catch {
    return null;
  }
}
export function clearAdminSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
