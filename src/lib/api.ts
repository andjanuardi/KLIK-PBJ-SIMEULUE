import { API_URL } from "./config";
import { DEFAULT_SETTINGS, getAdminSession } from "./store";
import type { AdminSession, DocItem, SiteSettings } from "./store";
import { LAYANAN } from "../types";
import type { BentukKonsultasi, Reply, StatusTiket, Ticket } from "../types";

export class ApiError extends Error {
  code?: number;
  constructor(message: string, code?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

async function request(action: string, init: { params?: Record<string, string>; body?: Record<string, unknown> } = {}) {
  const isPost = init.body !== undefined;
  const url = isPost ? API_URL : `${API_URL}?${new URLSearchParams({ action, ...(init.params ?? {}) })}`;
  let res: Response;
  try {
    res = await fetch(
      url,
      isPost
        ? { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action, ...init.body }) }
        : { method: "GET" }
    );
  } catch {
    throw new ApiError("Tidak dapat menghubungi server. Periksa koneksi internet.");
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    throw new ApiError(`Respons server tidak valid (${res.status}).`, res.status);
  }
  if (!res.ok || !data?.ok) throw new ApiError(data?.error || `Server merespons ${res.status}.`, data?.code ?? res.status);
  return data;
}

const apiGet = (action: string, params?: Record<string, string>) => request(action, { params });
const apiPost = (action: string, body?: Record<string, unknown>) => request(action, { body: body ?? {} });

function token(): string {
  const t = getAdminSession()?.token;
  if (!t) throw new ApiError("Sesi berakhir. Silakan login kembali.", 401);
  return t;
}

/* ---------------- cache GET (per page-load) ---------------- */

const getCache = new Map<string, Promise<unknown>>();
function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = getCache.get(key);
  if (hit) return hit as Promise<T>;
  const p = fn();
  getCache.set(key, p);
  p.catch(() => getCache.delete(key));
  return p;
}
/** Hapus cache baca — dipanggil tiap mutasi berhasil. */
export function bustCache(): void {
  getCache.clear();
  layananCache = null;
}

/* ---------------- mapper snake_case → Ticket ---------------- */

function toBool(v: unknown): boolean {
  return v === true || String(v ?? "").trim().toUpperCase() === "TRUE";
}

/** URL lihat file Drive dari ID/nilai kolom file_drive_id. */
export function driveFileUrl(idOrUrl?: string): string | undefined {
  const raw = String(idOrUrl ?? "").trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://drive.google.com/file/d/${raw}/view`;
}

function toTicket(r: Record<string, any>, replies?: Array<Record<string, any>>): Ticket {
  return {
    id: String(r.kode ?? ""),
    kode: String(r.kode ?? ""),
    nama: String(r.nama ?? ""),
    nip: String(r.nip ?? ""),
    jabatan: String(r.jabatan ?? ""),
    skpk: String(r.skpk ?? ""),
    wa: String(r.wa ?? ""),
    jenisLayanan: String(r.jenis_layanan ?? ""),
    tahapan: String(r.tahapan ?? ""),
    metode: String(r.metode ?? ""),
    namaPaket: String(r.nama_paket ?? ""),
    nilai: String(r.nilai ?? ""),
    uraian: String(r.uraian ?? ""),
    pertanyaan: String(r.pertanyaan ?? ""),
    bentuk: (String(r.bentuk || "Jawaban/penjelasan tertulis") as BentukKonsultasi),
    fileName: r.file_name ? String(r.file_name) : undefined,
    fileDriveId: r.file_drive_id ? String(r.file_drive_id) : undefined,
    status: (String(r.status || "Dalam Proses") as StatusTiket),
    jawaban: (replies ?? []).map(
      (x): Reply => ({ id: String(x.id ?? ""), dari: x.dari === "petugas" ? "petugas" : "pemohon", teks: String(x.teks ?? ""), createdAt: String(x.created_at ?? "") })
    ),
    ringkasan: r.ringkasan ? String(r.ringkasan) : undefined,
    isPublished: r.is_published === undefined ? true : toBool(r.is_published),
    createdAt: String(r.created_at ?? ""),
    updatedAt: String(r.updated_at ?? r.created_at ?? ""),
    menungguPetugas: toBool(r.menunggu_petugas),
  };
}

function toDoc(d: Record<string, any>): DocItem {
  const raw = String(d.drive_id_atau_url ?? "");
  const isUrl = /^https?:\/\//i.test(raw);
  return {
    id: String(d.id ?? ""),
    judul: String(d.judul ?? ""),
    kategori: String(d.kategori ?? ""),
    tag: String(d.tag ?? d.kategori ?? ""),
    desc: String(d.desc ?? ""),
    fileName: d.file_name ? String(d.file_name) : undefined,
    url: isUrl ? raw : raw ? `https://drive.google.com/file/d/${raw}/view` : undefined,
    tipe: d.tipe === "file" ? "file" : d.tipe === "url" ? "url" : "info",
    size: d.size ? String(d.size) : undefined,
    createdAt: String(d.created_at ?? ""),
  };
}

/* ---------------- publik ---------------- */

export function getTicketsPublic(): Promise<Ticket[]> {
  return cached("ticketsPublic", async () => {
    const d = await apiGet("ticketsPublic");
    return (Array.isArray(d.tickets) ? d.tickets : []).map((r: Record<string, any>) => toTicket(r));
  });
}

export async function verifyTicket(kode: string, digits: string): Promise<Ticket> {
  const d = await apiGet("verifyTicket", { kode, digits });
  return toTicket(d.ticket, d.replies);
}

export function getSettings(): Promise<SiteSettings> {
  return cached("settings", async () => {
    const d = await apiGet("settings");
    const s = (d.settings ?? {}) as Partial<SiteSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...s,
      layananCustom: Array.isArray(s.layananCustom) ? (s.layananCustom as string[]) : [],
    };
  });
}

export function getDocs(): Promise<DocItem[]> {
  return cached("docs", async () => {
    const d = await apiGet("docs");
    const docs: DocItem[] = (Array.isArray(d.docs) ? d.docs : []).map((r: Record<string, any>) => toDoc(r));
    // terbaru di atas; tanggal tak valid → paling bawah
    const t = (v?: string) => {
      const n = +new Date(v ?? "");
      return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY;
    };
    docs.sort((a, b) => t(b.createdAt) - t(a.createdAt));
    return docs;
  });
}

let layananCache: string[] | null = null;
export async function getAllLayanan(): Promise<string[]> {
  if (layananCache) return layananCache;
  try {
    layananCache = [...LAYANAN, ...(await getSettings()).layananCustom];
  } catch {
    layananCache = [...LAYANAN];
  }
  return layananCache;
}
/** Daftar layanan sinkron (cache / bawaan) — untuk validasi form. */
export function getCachedLayanan(): string[] {
  return layananCache ?? [...LAYANAN];
}

export interface CreateTicketInput {
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
  bentuk: string;
  fileName?: string;
  fileDriveId?: string;
  /** Lampiran inline (disimpan dengan nama = nomor tiket). */
  file?: { filename: string; mime: string; base64: string };
}

export async function createTicket(input: CreateTicketInput): Promise<string> {
  const d = await apiPost("createTicket", { ticket: input });
  bustCache();
  return String(d.kode);
}

export async function addReplyPemohon(kode: string, digits: string, teks: string): Promise<Ticket> {
  await apiPost("addReplyPemohon", { kode, digits, teks });
  bustCache();
  return verifyTicket(kode, digits);
}

const UPLOAD_MIME = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? "").split(",").pop() ?? "");
    r.onerror = () => reject(new ApiError("Gagal membaca file."));
    r.readAsDataURL(file);
  });
}

export async function uploadFile(file: File, name?: string): Promise<{ fileId: string; url: string }> {
  if (!UPLOAD_MIME.includes(file.type)) throw new ApiError("Hanya PDF / PNG / JPG.");
  if (file.size > 11 * 1024 * 1024) throw new ApiError("File terlalu besar (maks ~11MB).");
  const base64 = await fileToBase64(file);
  const d = await apiPost("uploadFile", { filename: file.name, name, mime: file.type, base64 });
  return { fileId: String(d.fileId), url: String(d.url) };
}

/* ---------------- petugas (butuh sesi) ---------------- */

export async function login(email: string, pass: string): Promise<AdminSession & { token: string }> {
  const d = await apiPost("login", { email, pass });
  return d.session as AdminSession & { token: string };
}

export async function getTicketsAdmin(): Promise<Ticket[]> {
  const d = await apiGet("ticketsAdmin", { session: token() });
  return (Array.isArray(d.tickets) ? d.tickets : []).map((r: Record<string, any>) => toTicket(r));
}

export async function getTicketAdmin(kode: string): Promise<Ticket> {
  const d = await apiGet("ticketAdmin", { session: token(), kode });
  return toTicket(d.ticket, d.replies);
}

export async function petugasReply(kode: string, teks: string, opts?: { status?: StatusTiket; ringkasan?: string }): Promise<void> {
  await apiPost("petugasReply", { session: token(), kode, teks, ...opts });
  bustCache();
}

export async function updateTicket(kode: string, patch: Partial<Pick<Ticket, "status" | "isPublished" | "ringkasan">>): Promise<void> {
  await apiPost("updateTicket", { session: token(), kode, patch });
  bustCache();
}

export async function deleteTicket(kode: string): Promise<void> {
  await apiPost("deleteTicket", { session: token(), kode });
  bustCache();
}

export interface AdminUserInput {
  email?: string;
  pass?: string;
  nama?: string;
  role?: "admin" | "tim";
  layanan?: string;
  aktif?: boolean;
}

export async function getUsers(): Promise<Array<AdminSession & { id: string; aktif: boolean }>> {
  const d = await apiGet("users", { session: token() });
  return (Array.isArray(d.users) ? d.users : []).map((u: Record<string, any>) => ({
    id: String(u.id ?? ""),
    email: String(u.email ?? ""),
    nama: String(u.nama ?? ""),
    role: u.role === "admin" ? "admin" : "tim",
    layanan: u.layanan ? String(u.layanan) : undefined,
    aktif: toBool(u.aktif),
    at: "",
  }));
}

export async function createUser(input: { email: string; pass: string; nama: string; role: "admin" | "tim"; layanan?: string }): Promise<void> {
  await apiPost("createUser", { session: token(), user: input });
}

export async function updateUser(id: string, patch: AdminUserInput): Promise<void> {
  await apiPost("updateUser", { session: token(), id, patch });
}

export async function deleteUser(id: string): Promise<void> {
  await apiPost("deleteUser", { session: token(), id });
}

export async function saveSettings(s: SiteSettings): Promise<void> {
  const { ...rest } = s;
  await apiPost("saveSettings", { session: token(), settings: rest });
  bustCache();
}

export async function addDoc(d: { judul: string; kategori: string; desc: string; tipe: "file" | "url"; fileName?: string; driveId?: string; url?: string; size?: string }): Promise<void> {
  await apiPost("addDoc", { session: token(), doc: d });
  bustCache();
}

export async function updateDoc(id: string, patch: Partial<{ judul: string; kategori: string; desc: string; url: string }>): Promise<void> {
  await apiPost("updateDoc", { session: token(), id, patch });
  bustCache();
}

export async function deleteDoc(id: string): Promise<void> {
  await apiPost("deleteDoc", { session: token(), id });
  bustCache();
}
