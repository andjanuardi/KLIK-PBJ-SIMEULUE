import { motion } from "framer-motion";
import { BrushCleaning, FileText, HardHat, Package, ScrollText, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoDefault from "../assets/logo.png";
import { useCountUp } from "../hooks/useCountUp";
import { DEFAULT_SETTINGS, getAllLayanan, loadSettings } from "../lib/store";
import type { Ticket } from "../types";

const QUICK_BASE: { label: string; icon: typeof Package; chip: string; glow: string }[] = [
  { label: "Pengadaan Barang", icon: Package, chip: "bg-blue-500/20 ring-blue-300/30 text-blue-100", glow: "hover:border-blue-300/60 hover:bg-blue-500/15" },
  { label: "Jasa Konstruksi", icon: HardHat, chip: "bg-orange-500/20 ring-orange-300/30 text-orange-100", glow: "hover:border-orange-300/60 hover:bg-orange-500/15" },
  { label: "Jasa Konsultansi", icon: FileText, chip: "bg-violet-500/20 ring-violet-300/30 text-violet-100", glow: "hover:border-violet-300/60 hover:bg-violet-500/15" },
  { label: "Jasa Lainnya", icon: BrushCleaning, chip: "bg-teal-500/20 ring-teal-300/30 text-teal-100", glow: "hover:border-teal-300/60 hover:bg-teal-500/15" },
  { label: "Pasca Kontrak", icon: ScrollText, chip: "bg-rose-500/20 ring-rose-300/30 text-rose-100", glow: "hover:border-rose-300/60 hover:bg-rose-500/15" },
];

const CAT_BAR: Record<string, string> = {
  "Pengadaan Barang": "bg-blue-400",
  "Jasa Konstruksi": "bg-orange-400",
  "Jasa Konsultansi": "bg-violet-400",
  "Jasa Lainnya": "bg-teal-400",
  "Pasca Kontrak": "bg-rose-400",
};

export default function Hero({ tickets = [], loading }: { tickets?: Ticket[]; loading?: boolean }) {
  const nav = useNavigate();
  const settings = loadSettings();
  const logo = settings.logoDataUrl || logoDefault;
  const allLayanan = getAllLayanan();
  const QUICK = allLayanan.map((l) => {
    const base = QUICK_BASE.find((q) => q.label === l);
    if (base) return base;
    return { label: l, icon: Sparkles, chip: "bg-slate-500/20 ring-slate-300/30 text-slate-100", glow: "hover:border-slate-300/60 hover:bg-slate-500/15" };
  });
  const total = tickets.length;
  const selesai = tickets.filter((t) => t.status === "Selesai").length;
  const proses = tickets.filter((t) => t.status !== "Selesai").length;
  const rate = total ? Math.round((selesai / total) * 100) : 0;

  const cTotal = useCountUp(total, 1100, !loading);
  const cSelesai = useCountUp(selesai, 1100, !loading);
  const cProses = useCountUp(proses, 1100, !loading);
  const cRate = useCountUp(rate, 1100, !loading);

  const headStats = [
    { label: "Total Konsultasi", value: loading ? "–" : String(cTotal), sub: "tiket masuk" },
    { label: "Dalam Proses", value: loading ? "–" : String(cProses), sub: "ditelah petugas" },
    { label: "Selesai", value: loading ? "–" : String(cSelesai), sub: `${rate}% tuntas` },
    { label: "Penyelesaian", value: loading ? "–" : `${cRate}%`, sub: "target ≥ 90%" },
  ];

  const perCat = allLayanan.map((l) => {
    const list = tickets.filter((t) => t.jenisLayanan === l);
    const done = list.filter((t) => t.status === "Selesai").length;
    const pct = list.length ? Math.round((done / list.length) * 100) : 0;
    return { label: l, total: list.length, done, pct };
  });

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-blob absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="animate-blob-2 absolute top-10 right-0 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] bg-[size:28px_28px]" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-10 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <motion.img src={logo} alt="Logo KLIK-PBJ Simeulue" initial={{ opacity: 0, scale: 0.85, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6 }} whileHover={{ scale: 1.04, rotate: -1 }} className="mx-auto mb-5 h-28 w-28 rounded-[2rem] bg-white object-cover shadow-2xl ring-4 ring-white/20 md:h-36 md:w-36" />
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-xs font-bold tracking-[0.25em] text-emerald-300 uppercase">
            Pemerintah Kabupaten Simeulue
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }} className="mt-2 text-3xl leading-tight font-extrabold tracking-tight md:text-5xl">
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">{settings.heroTitle || DEFAULT_SETTINGS.heroTitle}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.16 }} className="mt-3 text-sm font-semibold text-slate-200 md:text-base">
            {settings.heroSubtitle || DEFAULT_SETTINGS.heroSubtitle}
          </motion.p>
          {(settings.infoText || DEFAULT_SETTINGS.infoText) && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mx-auto mt-4 max-w-xl text-xs leading-relaxed text-slate-300 italic">
              “{settings.infoText || DEFAULT_SETTINGS.infoText}”
            </motion.p>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.3 }} className="mt-10">
          <p className="mb-3 text-center text-[11px] font-bold tracking-widest text-slate-400 uppercase">Akses cepat pengaduan per layanan</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {QUICK.map((q, i) => (
              <motion.button
                key={q.label}
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.35 + i * 0.07 }}
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => nav(`/ajukan?layanan=${encodeURIComponent(q.label)}`)}
                className={`group flex cursor-pointer flex-col items-start gap-2 rounded-2xl border border-white/15 bg-white/[0.07] p-3.5 text-left ring-1 ring-transparent backdrop-blur transition ${q.glow}`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${q.chip}`}>
                  <q.icon size={17} />
                </span>
                <span>
                  <span className="block text-[13px] leading-tight font-bold text-white">{q.label}</span>
                  <span className="mt-1 block text-[11px] font-medium text-slate-400 transition group-hover:text-slate-200">Ajukan →</span>
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="mt-8">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {headStats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 + i * 0.07 }} whileHover={{ y: -4 }} className="rounded-2xl border border-white/12 bg-white/[0.07] px-5 py-4 backdrop-blur">
                <p className="text-2xl font-extrabold tracking-tight tabular-nums">{loading ? <span className="skeleton-shimmer inline-block h-7 w-16 rounded-lg" /> : s.value}</p>
                <p className="mt-0.5 text-[13px] font-bold text-slate-100">{s.label}</p>
                <p className="text-[11px] text-slate-400">{s.sub}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-2.5 rounded-2xl border border-white/12 bg-white/[0.05] p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[13px] font-bold">Penyelesaian per kategori layanan</p>
              <p className="text-[11px] text-slate-400">selesai / total • update otomatis</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {perCat.map((c, i) => (
                <motion.div key={c.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.06 }}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-xs font-bold text-slate-200">{c.label}</p>
                    <p className="shrink-0 text-[11px] font-bold text-slate-300 tabular-nums">{loading ? "–" : `${c.done}/${c.total}`}</p>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div initial={{ width: 0 }} animate={{ width: loading ? "0%" : `${c.pct}%` }} transition={{ duration: 0.9, delay: 0.7 + i * 0.08 }} className={`h-full rounded-full ${CAT_BAR[c.label] ?? "bg-emerald-400"}`} />
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-emerald-300 tabular-nums">{loading ? "…" : `${c.pct}% selesai`}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
      {(settings.disclaimerAktif !== false && (settings.disclaimerText || DEFAULT_SETTINGS.disclaimerText)) && (
        <div className="marquee-pause relative border-t border-amber-300/20 bg-amber-400/10">
          <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-hidden px-4 py-2.5">
            <span className="shrink-0 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-extrabold whitespace-nowrap text-slate-900">Disclaimer</span>
            <div className="overflow-hidden">
              <div className="animate-marquee flex w-max whitespace-nowrap">
                {[0, 1].map((n) => (
                  <span key={n} className="pr-16 text-[11px] leading-relaxed text-amber-100/90">
                    {settings.disclaimerText || DEFAULT_SETTINGS.disclaimerText}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
