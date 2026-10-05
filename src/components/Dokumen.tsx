import { ChevronLeft, ChevronRight, Download, FileText, Scale, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { loadDocs } from "../lib/store";
import type { DocItem } from "../lib/store";
import { Empty, Skeleton } from "./ui";

const ICONS = [Scale, FileText, FileText, Download, Download, Scale];
const PAGE_SIZE = 6;

function SkeletonCards() {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-5">
          <Skeleton className="h-11 w-11 shrink-0 !rounded-2xl" />
          <span className="min-w-0 flex-1">
            <Skeleton className="h-4 w-20 !rounded-full" />
            <Skeleton className="mt-2 h-4 w-4/5" />
            <Skeleton className="mt-1.5 h-3 w-3/5" />
            <Skeleton className="mt-2.5 h-3 w-24" />
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Dokumen({ loading }: { loading?: boolean }) {
  const docs: DocItem[] = useMemo(() => (loading ? [] : loadDocs()), [loading]);
  const [cat, setCat] = useState("Semua");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const cats = useMemo(() => {
    const set = new Set(docs.map((d) => d.kategori || d.tag));
    return ["Semua", ...Array.from(set)];
  }, [docs]);

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    return docs.filter((d) => {
      if (cat !== "Semua" && (d.kategori || d.tag) !== cat) return false;
      if (key && !`${d.judul} ${d.kategori} ${d.tag} ${d.desc}`.toLowerCase().includes(key)) return false;
      return true;
    });
  }, [docs, cat, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const to = Math.min(filtered.length, safePage * PAGE_SIZE + PAGE_SIZE);

  const pickCat = (c: string) => { setCat(c); setPage(0); };
  const pickQuery = (v: string) => { setQ(v); setPage(0); };

  return (
    <div>
      <div>
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Informasi & Dokumen Referensi PBJ</h2>
        <p className="text-xs text-slate-500">Unduh dasar hukum dan template yang sering dipakai dalam konsultasi • {loading ? "…" : `${filtered.length} dokumen`}</p>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button key={c} onClick={() => pickCat(c)} className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition ${cat === c ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-100"}`}>{c}</button>
          ))}
        </div>
        <label className="relative block sm:w-64 sm:shrink-0">
          <Search size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => pickQuery(e.target.value)}
            placeholder="Cari judul / kategori…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </label>
      </div>
      {loading ? (
        <SkeletonCards />
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((d, i) => {
            const Icon = ICONS[(safePage * PAGE_SIZE + i) % ICONS.length];
            const href = d.tipe === "url" && d.url ? d.url : d.dataUrl;
            const external = d.tipe === "url" && !!d.url;
            const inner = (
              <>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white group-hover:bg-emerald-600">
                  <Icon size={19} />
                </span>
                <span>
                  <span className="mb-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">{d.tag}</span>
                  <span className="block text-sm font-bold text-slate-800">{d.judul}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{d.desc}{d.fileName ? ` • ${d.fileName}` : ""}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">{href ? (external ? "Buka tautan" : "Unduh") : "Info"} <Download size={12} /></span>
                </span>
              </>
            );
            const cls = "group flex h-full items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_-12px_rgba(2,6,23,0.12)] hover:border-emerald-300";
            return href ? (
              <a
                key={d.id}
                href={href}
                {...(external ? { target: "_blank", rel: "noreferrer" } : { download: d.fileName ?? d.judul })}
                className={cls}
              >
                {inner}
              </a>
            ) : (
              <div key={d.id} className={cls}>
                {inner}
              </div>
            );
          })}
        </div>
      )}
      {!loading && filtered.length === 0 && <div className="mt-4"><Empty title="Tidak ada dokumen" desc="Coba kata kunci atau kategori lain." /></div>}
      {!loading && filtered.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Menampilkan {from}–{to} dari {filtered.length} dokumen • Halaman {safePage + 1} dari {totalPages}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Berikutnya <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
