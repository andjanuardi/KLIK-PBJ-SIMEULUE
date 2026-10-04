import { AnimatePresence, motion } from "framer-motion";
import { Download, FileText, Scale } from "lucide-react";
import { useMemo, useState } from "react";
import { loadDocs } from "../lib/store";
import type { DocItem } from "../lib/store";
import { Empty, Reveal } from "./ui";

const ICONS = [Scale, FileText, FileText, Download, Download, Scale];

export default function Dokumen() {
  const docs: DocItem[] = loadDocs();
  const [cat, setCat] = useState("Semua");

  const cats = useMemo(() => {
    const set = new Set(docs.map((d) => d.kategori || d.tag));
    return ["Semua", ...Array.from(set)];
  }, [docs]);

  const filtered = cat === "Semua" ? docs : docs.filter((d) => (d.kategori || d.tag) === cat);

  return (
    <div>
      <Reveal>
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Informasi & Dokumen Referensi PBJ</h2>
        <p className="text-xs text-slate-500">Unduh dasar hukum dan template yang sering dipakai dalam konsultasi • {filtered.length} dokumen</p>
      </Reveal>
      <div className="mt-4 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition ${cat === c ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-100"}`}>{c}</button>
        ))}
      </div>
      <motion.div layout className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial={false}>
          {filtered.map((d, i) => {
            const Icon = ICONS[i % ICONS.length];
            const href = d.tipe === "url" && d.url ? d.url : d.dataUrl;
            const external = d.tipe === "url" && !!d.url;
            const inner = (
              <>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white transition group-hover:bg-emerald-600">
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
            return (
              <motion.div key={d.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}>
                {href ? (
                  <motion.a
                    href={href}
                    {...(external ? { target: "_blank", rel: "noreferrer" } : { download: d.fileName ?? d.judul })}
                    whileHover={{ y: -6, scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex h-full items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_-12px_rgba(2,6,23,0.12)] transition hover:border-emerald-300"
                  >
                    {inner}
                  </motion.a>
                ) : (
                  <motion.div
                    whileHover={{ y: -6, scale: 1.015 }}
                    className="group flex h-full items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_-12px_rgba(2,6,23,0.12)] transition hover:border-emerald-300"
                  >
                    {inner}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
      {filtered.length === 0 && <div className="mt-4"><Empty title="Tidak ada dokumen" desc="Coba kategori lain." /></div>}
    </div>
  );
}
