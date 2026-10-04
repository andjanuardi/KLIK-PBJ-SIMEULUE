import { AnimatePresence, motion } from "framer-motion";
import { FileText, Inbox, LogOut, Reply as ReplyIcon, Search, Settings2, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Empty, LayananBadge, Reveal, Skeleton, StatusBadge } from "../components/ui";
import { formatJam, formatTanggal } from "../lib/masking";
import { clearAdminSession, deleteTicket, getAdminSession, loadTickets, petugasReply } from "../lib/store";
import type { StatusTiket, Ticket } from "../types";
import DocsTab from "../components/admin/DocsTab";
import SettingsTab from "../components/admin/SettingsTab";
import UsersTab from "../components/admin/UsersTab";

function KonsultasiTab() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const [balas, setBalas] = useState("");
  const [status, setStatus] = useState<StatusTiket>("Selesai");
  const [filter, setFilter] = useState("Dalam Proses");
  const [q, setQ] = useState("");
  const [filtering, setFiltering] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setTickets(loadTickets().sort((a, b) => +new Date(b.updatedAt ?? b.createdAt) - +new Date(a.updatedAt ?? a.createdAt)));
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading) return;
    setFiltering(true);
    const t = setTimeout(() => setFiltering(false), 320);
    return () => clearTimeout(t);
  }, [q, filter, loading]);

  const counts = useMemo(() => ({
    tindakLanjut: tickets.filter((t) => t.menungguPetugas).length,
    proses: tickets.filter((t) => t.status === "Dalam Proses").length,
  }), [tickets]);

  const FILTERS = ["Perlu Tindak Lanjut", "Semua", "Dalam Proses", "Perlu Klarifikasi", "Selesai"];

  const rows = useMemo(() => {
    const out = tickets.filter((t) => {
      if (filter === "Perlu Tindak Lanjut" && !t.menungguPetugas) return false;
      if (filter !== "Semua" && filter !== "Perlu Tindak Lanjut" && t.status !== filter) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        return (
          t.kode.toLowerCase().includes(s) ||
          t.namaPaket.toLowerCase().includes(s) ||
          t.skpk.toLowerCase().includes(s) ||
          t.nama.toLowerCase().includes(s)
        );
      }
      return true;
    });
    // aktivitas terakhir dulu (balasan / perubahan status)
    out.sort((a, b) => +new Date(b.updatedAt ?? b.createdAt) - +new Date(a.updatedAt ?? a.createdAt));
    return out;
  }, [tickets, filter, q]);
  const t = rows.find((r) => r.kode === active) ?? tickets.find((r) => r.kode === active) ?? null;

  const refresh = () => setTickets(loadTickets().sort((a, b) => +new Date(b.updatedAt ?? b.createdAt) - +new Date(a.updatedAt ?? a.createdAt)));
  const busy = loading || filtering;

  const kirimBalasan = () => {
    if (!t || balas.trim().length < 5) return;
    petugasReply(t.kode, balas.trim(), { status, ringkasan: balas.trim().slice(0, 260) });
    setBalas("");
    refresh();
  };

  return (
    <div>
      <p className="text-sm text-slate-500">{tickets.length} tiket • balas, ubah status & publish ringkasan ke tabel publik.</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-bold ring-1 transition ${filter === s ? (s === "Perlu Tindak Lanjut" ? "bg-amber-500 text-white ring-amber-500" : "bg-slate-900 text-white ring-slate-900") : "bg-white text-slate-600 ring-slate-200"}`}>
            {s === "Perlu Tindak Lanjut" ? `↩ ${s} (${counts.tindakLanjut})` : s === "Dalam Proses" ? `${s} (${counts.proses})` : s}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari kode / paket / SKPK…" className="w-56 rounded-xl border border-slate-200 bg-white py-1.5 pr-3 pl-9 text-xs outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{rows.length} tiket • urut aktivitas terakhir • ↩ = ada klarifikasi/balasan baru dari pemohon</p>
      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card className="overflow-hidden">
          <div className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
            {busy && Array.from({ length: 5 }).map((_, i) => (
              <motion.div key={`sk-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }} className="space-y-2 px-5 py-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </motion.div>
            ))}
            {!busy && rows.length === 0 && <div className="p-4"><Empty title="Antrean kosong" desc="Coba ubah kata kunci atau filter status." /></div>}
            {!busy && (
            <AnimatePresence initial={false}>
              {rows.map((r, idx) => (
                <motion.button
                  key={r.id}
                  layout
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  onClick={() => setActive(r.kode)}
                  className={`block w-full cursor-pointer px-5 py-4 text-left transition ${active === r.kode ? "bg-emerald-50/70" : r.menungguPetugas ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-slate-50"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-slate-800">{r.kode}</span>
                    <LayananBadge label={r.jenisLayanan} /><StatusBadge status={r.status} />
                    {r.menungguPetugas && <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 ring-1 ring-amber-300">↩ Tindak lanjut</span>}
                    <span className="ml-auto text-right text-[11px] leading-tight text-slate-400">{formatTanggal(r.updatedAt ?? r.createdAt)}<br />🕐 {formatJam(r.updatedAt ?? r.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-bold text-slate-800">{r.namaPaket}</p>
                  <p className="truncate text-xs text-slate-500">{r.skpk} • {r.uraian.slice(0, 80)}…</p>
                </motion.button>
              ))}
            </AnimatePresence>
            )}
          </div>
        </Card>

        <AnimatePresence mode="wait">
          {t ? (
            <motion.div key={t.kode} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.3 }}>
              <Card className="space-y-4 p-5">
                <div>
                  <p className="font-mono text-sm font-extrabold">{t.kode}</p>
                  <p className="text-sm font-bold">{t.namaPaket}</p>
                  <p className="text-xs text-slate-500">{t.nama} • {t.jabatan} • {t.skpk}<br />WA {t.wa} • NIP {t.nip}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-200">{t.uraian}</div>
                {t.menungguPetugas && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-300">
                    <p className="font-extrabold">↩ Klarifikasi / pesan baru dari pemohon — perlu respons Anda</p>
                    <p className="mt-1 line-clamp-3">“{(t.jawaban.filter((r) => r.dari === "pemohon").pop()?.teks ?? "Tiket baru, belum ada balasan.").slice(0, 200)}”</p>
                  </motion.div>
                )}
                <div className="space-y-1.5">
                  {t.jawaban.map((r) => (
                    <div key={r.id} className={`rounded-xl px-3 py-2 text-xs ${r.dari === "petugas" ? "bg-emerald-600 text-white" : "bg-white ring-1 ring-slate-200"}`}>{r.teks}</div>
                  ))}
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-bold text-slate-600">✍️ Balasan resmi</p>
                  <textarea value={balas} onChange={(e) => setBalas(e.target.value)} rows={4} placeholder="Tulis jawaban mengacu pasal…" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                </div>
                <div className="flex gap-2">
                  <select value={status} onChange={(e) => setStatus(e.target.value as StatusTiket)} className="flex-1 cursor-pointer rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold">
                    <option>Dalam Proses</option><option>Selesai</option><option>Perlu Klarifikasi</option>
                  </select>
                  <Button size="sm" onClick={kirimBalasan}><ReplyIcon size={14} /> Balas</Button>
                </div>
                <button onClick={() => { if (t && confirm(`Hapus ${t.kode}?`)) { deleteTicket(t.kode); setActive(null); refresh(); } }} className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-rose-600 hover:underline"><Trash2 size={13} /> Hapus tiket</button>
                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 ring-1 ring-emerald-200">Ringkasan otomatis ter-publish ke tabel publik saat status Selesai.</p>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Empty title="Pilih tiket di antrean" desc="Klik salah satu tiket untuk membaca detail & memberi balasan." /></motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

type Tab = "konsultasi" | "pengguna" | "pengaturan" | "dokumen";

export default function Admin() {
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("konsultasi");
  const session = getAdminSession();
  const isAdmin = session?.role === "admin";

  useEffect(() => {
    if (!getAdminSession()) nav("/admin/login");
  }, [nav]);

  const tabs: { id: Tab; label: string; icon: typeof Inbox; admin?: boolean }[] = [
    { id: "konsultasi", label: "Konsultasi", icon: Inbox },
    { id: "pengguna", label: "Pengguna", icon: Users, admin: true },
    { id: "pengaturan", label: "Pengaturan", icon: Settings2, admin: true },
    { id: "dokumen", label: "Dokumen", icon: FileText, admin: true },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Dashboard {isAdmin ? "Admin" : "Operator"}</h1>
            <p className="text-sm text-slate-500">Halo, {session?.nama || session?.email} 👋</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { clearAdminSession(); nav("/"); }}><LogOut size={14} /> Keluar</Button>
        </div>
      </Reveal>
      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.filter((t) => !t.admin || isAdmin).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold ring-1 transition ${tab === t.id ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {tab === "konsultasi" && <KonsultasiTab />}
            {tab === "pengguna" && (isAdmin ? <UsersTab /> : <Empty title="Akses ditolak" desc="Hanya admin yang dapat mengelola pengguna." />)}
            {tab === "pengaturan" && (isAdmin ? <SettingsTab /> : <Empty title="Akses ditolak" desc="Hanya admin yang dapat mengubah pengaturan." />)}
            {tab === "dokumen" && (isAdmin ? <DocsTab /> : <Empty title="Akses ditolak" desc="Hanya admin yang dapat mengelola dokumen." />)}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
