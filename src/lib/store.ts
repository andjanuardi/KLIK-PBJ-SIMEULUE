import type { Ticket, Reply, StatusTiket, Layanan } from "../types";
import { LAYANAN } from "../types";

const TICKET_KEY = "klinik_pbj_tickets_v1";
const SESSION_KEY = "klinik_pbj_admin_session_v1";

function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

export function genKode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `KLN-${s}`;
}

function normalize(t: Ticket): Ticket {
  const updatedAt = t.updatedAt ?? t.createdAt;
  let menungguPetugas = t.menungguPetugas;
  if (menungguPetugas === undefined) {
    // migrasi data lama: butuh tindak lanjut bila belum selesai dan (belum dijawab / balasan terakhir dari pemohon)
    const last = t.jawaban[t.jawaban.length - 1];
    menungguPetugas = t.status !== "Selesai" && (!last || last.dari === "pemohon");
  }
  if (t.updatedAt === undefined || t.menungguPetugas === undefined) {
    return { ...t, updatedAt, menungguPetugas };
  }
  return t;
}

export function loadTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(TICKET_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as Ticket[]).map(normalize) : [];
  } catch {
    return [];
  }
}

export function saveTickets(list: Ticket[]): void {
  localStorage.setItem(TICKET_KEY, JSON.stringify(list));
}

export function createTicket(input: Omit<Ticket, "id" | "kode" | "createdAt" | "updatedAt" | "jawaban" | "status" | "isPublished" | "menungguPetugas"> & Partial<Pick<Ticket, "status" | "isPublished">>): Ticket {
  const list = loadTickets();
  let kode = genKode();
  while (list.some((t) => t.kode === kode)) kode = genKode();
  const now = new Date().toISOString();
  const t: Ticket = {
    ...input,
    id: uid(),
    kode,
    jawaban: [],
    status: input.status ?? "Dalam Proses",
    isPublished: input.isPublished ?? true,
    createdAt: now,
    updatedAt: now,
    menungguPetugas: true,
  } as Ticket;
  list.unshift(t);
  saveTickets(list);
  return t;
}

export function getTicket(kode: string): Ticket | undefined {
  return loadTickets().find((t) => t.kode.toUpperCase() === kode.trim().toUpperCase());
}

export function addReply(kode: string, reply: Omit<Reply, "id" | "createdAt">): Ticket | undefined {
  const list = loadTickets();
  const i = list.findIndex((t) => t.kode.toUpperCase() === kode.trim().toUpperCase());
  if (i < 0) return undefined;
  const r: Reply = { ...reply, id: uid(), createdAt: new Date().toISOString() };
  const now = new Date().toISOString();
  list[i] = { ...list[i], jawaban: [...list[i].jawaban, r], updatedAt: now };
  // pertanyaan lanjutan pemohon -> otomatis kembali Dalam Proses + flag tindak lanjut
  if (reply.dari === "pemohon") {
    list[i] = {
      ...list[i],
      status: list[i].status === "Selesai" ? "Dalam Proses" : list[i].status,
      menungguPetugas: true,
    };
  } else {
    // balasan petugas -> tidak ada lagi yang menunggu respons petugas
    list[i] = { ...list[i], menungguPetugas: false };
  }
  saveTickets(list);
  return list[i];
}

export function updateTicket(kode: string, patch: Partial<Pick<Ticket, "status" | "isPublished" | "ringkasan">>): Ticket | undefined {
  const list = loadTickets();
  const i = list.findIndex((t) => t.kode.toUpperCase() === kode.trim().toUpperCase());
  if (i < 0) return undefined;
  list[i] = { ...list[i], ...patch, updatedAt: new Date().toISOString() };
  if (patch.status === "Selesai") list[i] = { ...list[i], menungguPetugas: false };
  saveTickets(list);
  return list[i];
}

export function petugasReply(kode: string, teks: string, opts?: { status?: StatusTiket; ringkasan?: string }): Ticket | undefined {
  const t = addReply(kode, { dari: "petugas", teks });
  if (!t) return undefined;
  return updateTicket(kode, {
    status: opts?.status ?? t.status,
    ringkasan: opts?.ringkasan ?? t.ringkasan,
  });
}

export function deleteTicket(kode: string): void {
  saveTickets(loadTickets().filter((t) => t.kode !== kode));
}

// --- tiket terverifikasi sesi ini (agar alur Sukses -> Lacak mulus) ---
const VERIFIED_KEY = "klinik_pbj_verified_v1";
export function isVerified(kode: string): boolean {
  try {
    const raw = sessionStorage.getItem(VERIFIED_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    return arr.some((k) => k.toUpperCase() === kode.trim().toUpperCase());
  } catch {
    return false;
  }
}
export function markVerified(kode: string): void {
  try {
    const raw = sessionStorage.getItem(VERIFIED_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    if (!arr.some((k) => k.toUpperCase() === kode.trim().toUpperCase())) {
      arr.push(kode.trim().toUpperCase());
      sessionStorage.setItem(VERIFIED_KEY, JSON.stringify(arr));
    }
  } catch { /* abaikan */ }
}
// --- admin session (mock) ---
export interface AdminSession {
  email: string;
  role: "admin" | "operator";
  nama: string;
  at: string;
}
function normRole(r: unknown): "admin" | "operator" {
  return r === "operator" ? "operator" : "admin";
}
export function setAdminSession(email: string, role: AdminSession["role"] = "admin", nama = ""): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, role, nama, at: new Date().toISOString() }));
}
export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    // kompatibel data lama: superadmin → admin, sesi email-only
    if (!s.role) {
      const u = loadUsers().find((x) => x.email === s.email);
      return { email: s.email, role: normRole(u?.role), nama: u?.nama ?? "", at: s.at ?? "" };
    }
    return { email: s.email, role: normRole(s.role), nama: s.nama ?? "", at: s.at ?? "" } as AdminSession;
  } catch {
    return null;
  }
}
export function clearAdminSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// --- manajemen user (RBAC) ---
import type { AdminUser } from "../types";
import { SEED_ADMINS } from "./seed";
const USERS_KEY = "klinik_pbj_users_v1";

export function loadUsers(): AdminUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      const seed: AdminUser[] = SEED_ADMINS.map((a, i) => ({ ...a, id: `u-seed-${i}`, aktif: true }));
      localStorage.setItem(USERS_KEY, JSON.stringify(seed));
      return seed;
    }
    const arr = JSON.parse(raw);
    const list: AdminUser[] = (Array.isArray(arr) ? arr : []).map((u) => ({
      ...u,
      role: u.role === "operator" ? "operator" : "admin",
      aktif: u.aktif ?? true,
    }));
    return list;
  } catch {
    return [];
  }
}
export function saveUsers(list: AdminUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(list));
}
export function createUser(input: Omit<AdminUser, "id">): AdminUser {
  const list = loadUsers();
  const u: AdminUser = { ...input, id: uid() };
  list.push(u);
  saveUsers(list);
  return u;
}
export function updateUser(id: string, patch: Partial<AdminUser>): AdminUser | undefined {
  const list = loadUsers();
  const i = list.findIndex((u) => u.id === id);
  if (i < 0) return undefined;
  list[i] = { ...list[i], ...patch };
  saveUsers(list);
  return list[i];
}
export function deleteUser(id: string): void {
  saveUsers(loadUsers().filter((u) => u.id !== id));
}

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
const SETTINGS_KEY = "klinik_pbj_settings_v1";
export const DEFAULT_SETTINGS: SiteSettings = {
  heroTitle: "KLIK-PBJ SIMEULUE",
  heroSubtitle: "Klinik Layanan Integrasi Konsultasi Pengadaan Barang dan Jasa",
  infoText: "Visi Kabupaten Simeulue Tahun 2030: Mewujudkan Simeulue yang bermartabat & pusat pertumbuhan ekonomi biru.",
  disclaimerText: "Tanggapan Tim KLIK-PBJ bersifat konsultatif dan merupakan bahan pertimbangan, berdasarkan informasi dan dokumen yang disampaikan pada saat konsultasi. Tanggapan ini tidak mengambil alih kewenangan maupun tanggung jawab pejabat yang berwenang. Pihak yang berkonsultasi dapat memiliki pendapat berbeda dan wajib memastikan keputusan yang diambil sesuai ketentuan peraturan perundang-undangan. Segala keputusan, tindakan, dan konsekuensi atas pelaksanaannya menjadi tanggung jawab pihak/pejabat yang berwenang.",
  disclaimerAktif: true,
  jamLayanan: "Senin–Jumat • 08.00–16.00 WIB",
  layananCustom: [],
};
export function loadSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as SiteSettings & { visi?: string; infoLabel?: string };
    // migrasi format lama → infoText tunggal
    if (!parsed.infoText) {
      if (parsed.visi) parsed.infoText = parsed.visi;
      else if (parsed.infoLabel) parsed.infoText = parsed.infoLabel;
    } else if (parsed.infoLabel && !parsed.infoText.startsWith(parsed.infoLabel)) {
      parsed.infoText = `${parsed.infoLabel}: ${parsed.infoText}`;
    }
    delete parsed.visi;
    delete parsed.infoLabel;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
export function saveSettings(s: SiteSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

/** Semua layanan: bawaan + kustom dari pengaturan */
export function getAllLayanan(): string[] {
  try {
    return [...LAYANAN, ...loadSettings().layananCustom];
  } catch {
    return [...LAYANAN];
  }
}
export type { Layanan };

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
const DOCS_KEY = "klinik_pbj_docs_v1";
const OLD_DOC_IDS = ["doc-1", "doc-2", "doc-3", "doc-4", "doc-5", "doc-6"];
const DEFAULT_DOCS: DocItem[] = [
  { id: "doc-d1", judul: "REGULASI UTAMA PBJ", kategori: "Dasar Hukum", tag: "Folder Drive", desc: "Perpres 16/2018, 12/2021, 46/2025 & 17/2023 — folder Drive.", tipe: "url", url: "https://drive.google.com/drive/folders/1ccLWnoI9Kv1fZ1BS8XWRq6dMEfb8kel-", createdAt: new Date().toISOString() },
  { id: "doc-d2", judul: "KELEMBAGAAN DAN SDM", kategori: "Dasar Hukum", tag: "Folder Drive", desc: "UKPBJ, SDM & rencana aksi — folder Drive.", tipe: "url", url: "https://drive.google.com/drive/folders/1G2fD1hripGETh1PMlo44WHRO202n8hq6", createdAt: new Date().toISOString() },
  { id: "doc-d3", judul: "TKDN/P3DN", kategori: "Dasar Hukum", tag: "Folder Drive", desc: "UU 3/2014, PP 29/2018, Inpres 2/2022 & Permenperin 35/2025 — folder Drive.", tipe: "url", url: "https://drive.google.com/drive/folders/1ZQ1gqFg2yTWe5sNDxhn3CkaDxE7c0P62", createdAt: new Date().toISOString() },
  { id: "doc-d4", judul: "KATALOG DAN DIGITAL PBJ", kategori: "Panduan", tag: "Folder Drive", desc: "Katalog elektronik & transformasi digital — folder Drive.", tipe: "url", url: "https://drive.google.com/drive/folders/1yI6m5uXyDfmjoq1WYwEbhlO0-4tQqMOF", createdAt: new Date().toISOString() },
  { id: "doc-d5", judul: "PELAKSANAAN MELALUI PENYEDIA", kategori: "Panduan", tag: "Folder Drive", desc: "Perlem 12/2021 & 4/2024 — folder Drive.", tipe: "url", url: "https://drive.google.com/drive/folders/1QvUUDMRrACW-NFR9DP0lX3-zxi9YMiWg", createdAt: new Date().toISOString() },
  { id: "doc-d6", judul: "PERENCANAAN", kategori: "Panduan", tag: "Folder Drive", desc: "Perlem 11/2021 pedoman perencanaan — folder Drive.", tipe: "url", url: "https://drive.google.com/drive/folders/1Q8egMytqgUfqgcoOiezJACd2UGm5ePK1", createdAt: new Date().toISOString() },
  { id: "doc-d7", judul: "SWAKELOLA DAN PENGADAAN KHUSUS", kategori: "Panduan", tag: "Folder Drive", desc: "Swakelola & BLUD — folder Drive.", tipe: "url", url: "https://drive.google.com/drive/folders/1GahDqAsObpoSMokO__IpWUac1LgZD9oU", createdAt: new Date().toISOString() },
  { id: "doc-d8", judul: "Pedoman Pelaksanaan APBD Tahun 2026.pdf", kategori: "Panduan", tag: "Berkas Drive", desc: "Pedoman pelaksanaan APBD 2026.", tipe: "url", url: "https://drive.google.com/file/d/1DnwdxtBHf6PBk8b2eeGdEgC3tKGhPWjf/view", createdAt: new Date().toISOString() },
  { id: "doc-d9", judul: "Pemberitahuan Perubahan Kedua Perpres 16 Tahun 2028.pdf", kategori: "Dasar Hukum", tag: "Berkas Drive", desc: "Pemberitahuan perubahan kedua Perpres 16.", tipe: "url", url: "https://drive.google.com/file/d/1Scf2yrLi5zou0Xk8NDWVdaU0_p16cYDD/view", createdAt: new Date().toISOString() },
  { id: "doc-d10", judul: "Perbedaan Perpres 2021 dengan 2025.pdf", kategori: "Dasar Hukum", tag: "Berkas Drive", desc: "Matriks perbedaan Perpres 2021 vs 2025.", tipe: "url", url: "https://drive.google.com/file/d/1S-QC3gdpeE9ScnL5-s3n4aTnBmASs9m_/view", createdAt: new Date().toISOString() },
  { id: "doc-d11", judul: "SURAT LKPP 2025_WAJIB MIKOM KOMPETISI.pdf", kategori: "Dasar Hukum", tag: "Berkas Drive", desc: "Surat LKPP kewajiban mikom kompetisi.", tipe: "url", url: "https://drive.google.com/file/d/1t7X2cmops42pYOdgbVRKJ5jWBmA0qlcP/view", createdAt: new Date().toISOString() },
  { id: "doc-d12", judul: "JDIH LKPP – sumber regulasi resmi.txt", kategori: "Lainnya", tag: "Berkas Drive", desc: "Tautan sumber regulasi resmi JDIH LKPP.", tipe: "url", url: "https://drive.google.com/file/d/1yYYFU5MOQQNVzdnvhB2lAhYs0b4VIFOP/view", createdAt: new Date().toISOString() },
];
export function loadDocs(): DocItem[] {
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    if (!raw) {
      const seed = DEFAULT_DOCS.map((d) => ({ ...d, tipe: "info" as const }));
      localStorage.setItem(DOCS_KEY, JSON.stringify(seed));
      return seed;
    }
    const arr = JSON.parse(raw);
    // ganti set dummy lama (doc-1..doc-6) dengan 12 item Drive; data kustom admin dipertahankan
    if (Array.isArray(arr) && arr.length > 0 && arr.every((d: DocItem) => OLD_DOC_IDS.includes(d.id))) {
      const seed = DEFAULT_DOCS.map((d) => ({ ...d, createdAt: new Date().toISOString() }));
      localStorage.setItem(DOCS_KEY, JSON.stringify(seed));
      return seed;
    }
    const list: DocItem[] = (Array.isArray(arr) ? arr : [...DEFAULT_DOCS]).map((d: DocItem) => ({
      ...d,
      tipe: d.tipe ?? (d.dataUrl ? "file" : d.url ? "url" : "info"),
    }));
    return list;
  } catch {
    return [...DEFAULT_DOCS];
  }
}
export function saveDocs(list: DocItem[]): void {
  localStorage.setItem(DOCS_KEY, JSON.stringify(list));
}
export function addDoc(d: Omit<DocItem, "id" | "createdAt">): DocItem {
  const list = loadDocs();
  const item: DocItem = { ...d, id: uid(), createdAt: new Date().toISOString() };
  list.unshift(item);
  saveDocs(list);
  return item;
}
export function updateDoc(id: string, patch: Partial<DocItem>): DocItem | undefined {
  const list = loadDocs();
  const i = list.findIndex((d) => d.id === id);
  if (i < 0) return undefined;
  list[i] = { ...list[i], ...patch };
  saveDocs(list);
  return list[i];
}
export function deleteDoc(id: string): void {
  saveDocs(loadDocs().filter((d) => d.id !== id));
}
