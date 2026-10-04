import { motion } from "framer-motion";
import { CheckCircle2, Copy, Search } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Card, Reveal } from "../components/ui";

export default function Sukses() {
  const { kode } = useParams();
  const [copied, setCopied] = useState(false);

  const salin = async () => {
    try { await navigator.clipboard.writeText(kode ?? ""); } catch { /* clipboard tak tersedia */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <Reveal>
        <Card className="p-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
            <CheckCircle2 size={40} />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-5 text-2xl font-extrabold text-slate-900">Konsultasi Terkirim! 🎉</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            Simpan kode tiket berikut dan pantau jawaban petugas melalui menu Lacak Tiket.
          </motion.p>
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="mx-auto mt-6 max-w-xs rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 px-6 py-5">
            <p className="text-[11px] font-bold tracking-widest text-emerald-700 uppercase">Kode Tiket Unik</p>
            <p className="mt-1 font-mono text-3xl font-extrabold tracking-widest text-slate-900">{kode}</p>
            <button onClick={salin} className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700">
              <Copy size={13} /> {copied ? "Tersalin! ✓" : "Salin Kode"}
            </button>
          </motion.div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to={`/lacak?kode=${kode}`}><Button><Search size={15} /> Lacak Tiket</Button></Link>
          </div>
          <Link to="/" className="mt-4 inline-block text-xs font-semibold text-slate-400 hover:text-slate-600">← Kembali ke Beranda</Link>
        </Card>
      </Reveal>
    </main>
  );
}
