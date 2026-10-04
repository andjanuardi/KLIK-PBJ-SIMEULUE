import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Card, Empty, LayananBadge, Reveal, StatusBadge } from "../components/ui";
import { formatRupiah, formatTanggal, maskNama } from "../lib/masking";
import { getTicket } from "../lib/store";

export default function Detail() {
  const { kode } = useParams();
  const t = kode ? getTicket(kode) : undefined;

  if (!t) return <main className="mx-auto max-w-2xl px-4 py-12"><Empty title="Tiket tidak ditemukan" desc="Kode pada URL tidak cocok dengan data mana pun." /><Link to="/" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-700"><ArrowLeft size={15} /> Beranda</Link></main>;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800"><ArrowLeft size={15} /> Kembali</Link>
      <Reveal className="mt-3">
        <Card className="overflow-hidden">
          <div className="bg-slate-950 px-6 py-6 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <LayananBadge label={t.jenisLayanan} /><StatusBadge status={t.status} />
              <span className="ml-auto font-mono text-sm font-bold">{t.kode}</span>
            </div>
            <h1 className="mt-3 text-xl font-extrabold">{t.namaPaket}</h1>
            <p className="mt-1 text-xs text-slate-300">{t.skpk} • {maskNama(t.nama)} • {formatTanggal(t.createdAt)} • {t.metode} • HPS {formatRupiah(t.nilai)}</p>
          </div>
          <div className="space-y-4 p-6">
            <div><p className="text-xs font-bold tracking-wide text-slate-400 uppercase">Permasalahan</p><p className="mt-1 text-sm leading-relaxed text-slate-700">{t.uraian}</p></div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
              <p className="text-xs font-bold tracking-wide text-emerald-700 uppercase">✅ Ringkasan Jawaban Petugas</p>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-800">{t.ringkasan ?? t.jawaban.find((r) => r.dari === "petugas")?.teks ?? "Belum ada jawaban."}</p>
            </motion.div>
            <Link to={`/lacak?kode=${t.kode}`} className="inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700">Lacak & Tanya Lanjutan →</Link>
          </div>
        </Card>
      </Reveal>
    </main>
  );
}
