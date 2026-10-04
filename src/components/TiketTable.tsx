import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownWideNarrow, ChevronLeft, ChevronRight, Eye, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Ticket } from "../types";
import { formatJam, formatTanggal, maskNama } from "../lib/masking";
import { getAllLayanan } from "../lib/store";
import { Empty, LayananBadge, Reveal, Skeleton, StatusBadge } from "./ui";

const STATUS_OPTS = ["Semua", "Selesai", "Dalam Proses", "Perlu Klarifikasi"];

function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.tr
          key={`sk-${i}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: Math.min(i * 0.06, 0.5) }}
          className="border-t border-slate-100"
        >
          <td className="px-4 py-3">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="mt-1.5 h-3 w-14" />
          </td>
          <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
          <td className="px-4 py-3">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="mt-1.5 h-3 w-20" />
          </td>
          <td className="px-4 py-3"><Skeleton className="h-6 w-24 !rounded-full" /></td>
          <td className="px-4 py-3">
            <Skeleton className="h-3.5 w-44 max-w-full" />
            <Skeleton className="mt-1.5 h-3 w-32 max-w-full" />
          </td>
          <td className="px-4 py-3"><Skeleton className="h-6 w-20 !rounded-full" /></td>
          <td className="px-4 py-3 text-right"><Skeleton className="ml-auto h-7 w-20 !rounded-xl" /></td>
        </motion.tr>
      ))}
    </>
  );
}

export default function TiketTable({ tickets, loading }: { tickets: Ticket[]; loading?: boolean }) {
  const [q, setQ] = useState("");
  const [layanan, setLayanan] = useState("Semua");
  const [status, setStatus] = useState("Semua");
  const [sort, setSort] = useState<"Terbaru" | "Terlama">("Terbaru");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filtering, setFiltering] = useState(false);
  const LAYANAN_OPTS = useMemo(() => ["Semua", ...getAllLayanan()], []);

  const filtered = useMemo(() => {
    const out = tickets.filter((t) => {
      if (layanan !== "Semua" && t.jenisLayanan !== layanan) return false;
      if (status !== "Semua" && t.status !== status) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        return t.namaPaket.toLowerCase().includes(s) || t.skpk.toLowerCase().includes(s) || t.kode.toLowerCase().includes(s);
      }
      return true;
    });
    out.sort((a, b) => {
      const d = +new Date(a.createdAt) - +new Date(b.createdAt);
      return sort === "Terbaru" ? -d : d;
    });
    return out;
  }, [tickets, q, layanan, status, sort]);

  // mini-skeleton tiap filter/search/sort/page berubah (bukan loading awal)
  useEffect(() => {
    if (loading) return;
    setFiltering(true);
    const t = setTimeout(() => setFiltering(false), 320);
    return () => clearTimeout(t);
  }, [q, layanan, status, sort, page, perPage, loading]);

  const totalPage = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageSafe = Math.min(page, totalPage);
  const rows = filtered.slice((pageSafe - 1) * perPage, pageSafe * perPage);
  const busy = loading || filtering;
  const skCount = Math.min(perPage, 10);

  const reset = (fn: () => void) => () => { fn(); setPage(1); };

  return (
    <Reveal>
      <div id="tabel" className="scroll-mt-24 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_-12px_rgba(2,6,23,0.15)] md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Daftar Konsultasi Publik</h2>
            <p className="text-xs text-slate-500">Identitas pemohon disamarkan demi privasi • {filtered.length} tiket ditemukan • urut {sort.toLowerCase()} dulu</p>
          </div>
          <div className="relative">
            <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Cari paket / instansi / kode…" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 md:w-72" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {LAYANAN_OPTS.map((o) => (
            <button key={o} onClick={reset(() => setLayanan(o))} className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition ${layanan === o ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-100"}`}>{o}</button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {STATUS_OPTS.map((o) => (
            <button key={o} onClick={reset(() => setStatus(o))} className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition ${status === o ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-100"}`}>{o}</button>
          ))}
          <div className="ml-auto flex gap-2">
            <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              <ArrowDownWideNarrow size={13} className="text-slate-400" />
              <select value={sort} onChange={(e) => { setSort(e.target.value as "Terbaru" | "Terlama"); setPage(1); }} className="cursor-pointer bg-transparent outline-none">
                <option value="Terbaru">Terbaru</option>
                <option value="Terlama">Terlama</option>
              </select>
            </label>
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold">
              <option value={10}>10 / halaman</option>
              <option value={25}>25 / halaman</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Kode Tiket</th>
                <th className="px-4 py-3">SKPK / Instansi</th>
                <th className="px-4 py-3">Layanan</th>
                <th className="px-4 py-3">Paket</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {busy && <SkeletonRows count={skCount} />}
              {!busy && (
                <AnimatePresence initial={false}>
                  {rows.map((t, i) => (
                    <motion.tr
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.32, delay: Math.min(i * 0.04, 0.4) }}
                      className="border-t border-slate-100 transition hover:bg-emerald-50/40"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs font-semibold text-slate-600">{formatTanggal(t.createdAt)}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400 tabular-nums">{formatJam(t.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">{t.kode}</td>
                      <td className="px-4 py-3"><p className="text-[13px] font-bold text-slate-800">{t.skpk}</p><p className="text-[11px] text-slate-400">{maskNama(t.nama)}</p></td>
                      <td className="px-4 py-3"><LayananBadge label={t.jenisLayanan} /></td>
                      <td className="max-w-[240px] px-4 py-3"><p className="clamp-2 text-[13px] font-medium text-slate-700">{t.namaPaket}</p></td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3 text-right">
                        {t.status === "Selesai" ? (
                          <Link to={`/konsultasi/${t.kode}`} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"><Eye size={13} /> Ringkasan</Link>
                        ) : (
                          <Link to={`/lacak?kode=${t.kode}`} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200">Lacak</Link>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
          {!busy && rows.length === 0 && <div className="p-4"><Empty title="Tidak ada konsultasi ditemukan" desc="Coba ubah kata kunci atau reset filter kategori & status." /></div>}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>Halaman {pageSafe} dari {totalPage}</span>
          <div className="flex gap-2">
            <button disabled={pageSafe <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40"><ChevronLeft size={14} /> Prev</button>
            <button disabled={pageSafe >= totalPage} onClick={() => setPage((p) => p + 1)} className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40">Next <ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
