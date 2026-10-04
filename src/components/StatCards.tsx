import { motion } from "framer-motion";
import { CheckCircle2, Clock3, Inbox, Timer } from "lucide-react";
import type { Ticket } from "../types";
import { useCountUp } from "../hooks/useCountUp";
import { Reveal } from "./ui";

function useStats(tickets: Ticket[]) {
  const total = tickets.length;
  const selesai = tickets.filter((t) => t.status === "Selesai").length;
  const proses = tickets.filter((t) => t.status !== "Selesai").length;
  return { total, selesai, proses };
}

export default function StatCards({ tickets, loading }: { tickets: Ticket[]; loading?: boolean }) {
  const { total, selesai, proses } = useStats(tickets);
  const cTotal = useCountUp(total, 1100, !loading);
  const cSelesai = useCountUp(selesai, 1100, !loading);
  const cProses = useCountUp(proses, 1100, !loading);
  const rate = total ? Math.round((selesai / total) * 100) : 0;

  const cards = [
    { icon: Inbox, label: "Total Konsultasi", value: loading ? 0 : cTotal, suffix: "", color: "bg-blue-500", bar: "bg-blue-500", pct: 100, desc: "Seluruh tiket masuk" },
    { icon: Clock3, label: "Dalam Proses", value: loading ? 0 : cProses, suffix: "", color: "bg-amber-500", bar: "bg-amber-400", pct: total ? (proses / total) * 100 : 0, desc: "Sedang ditelaah petugas" },
    { icon: CheckCircle2, label: "Selesai", value: loading ? 0 : cSelesai, suffix: "", color: "bg-emerald-500", bar: "bg-emerald-500", pct: rate, desc: `${rate}% resolution rate` },
    { icon: Timer, label: "Rata-rata Respons", value: 18, suffix: " jam", color: "bg-violet-500", bar: "bg-violet-500", pct: 75, desc: "Target < 24 jam kerja", static: true },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, i) => (
        <Reveal key={c.label} delay={i * 0.07}>
          <motion.div whileHover={{ y: -6, scale: 1.015 }} transition={{ type: "spring", stiffness: 320, damping: 22 }} className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_-12px_rgba(2,6,23,0.15)]">
            <div className="flex items-start justify-between">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg ${c.color}`}>
                <c.icon size={20} />
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">#{i + 1}</span>
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
              {loading ? <span className="skeleton-shimmer inline-block h-8 w-20 rounded-lg" /> : <>{c.value}{c.suffix}</>}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-700">{c.label}</p>
            <p className="text-xs text-slate-400">{c.desc}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${c.pct}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 + i * 0.1 }} className={`h-full rounded-full ${c.bar}`} />
            </div>
          </motion.div>
        </Reveal>
      ))}
    </div>
  );
}
