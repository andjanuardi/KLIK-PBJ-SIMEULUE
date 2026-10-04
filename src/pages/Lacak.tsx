import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Circle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TicketThread from "../components/TicketThread";
import { Button, Card, Field, LayananBadge, Reveal, StatusBadge, inputCls } from "../components/ui";
import { formatJam, formatTanggal, last4 } from "../lib/masking";
import { getTicket, isVerified, markVerified } from "../lib/store";
import type { StatusTiket, Ticket } from "../types";

function Timeline({ status }: { status: StatusTiket }) {
  const steps = ["Diajukan", "Dalam Proses", "Selesai"];
  const idx = status === "Selesai" ? 2 : 1;
  return (
    <div>
      <div className="flex items-center">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <motion.span
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.12 }}
                className={`flex h-8 w-8 items-center justify-center rounded-full ring-2 ${i <= idx ? "bg-emerald-600 text-white ring-emerald-200" : "bg-white text-slate-300 ring-slate-200"}`}
              >
                {i <= idx ? <CheckCircle2 size={16} /> : <Circle size={14} />}
              </motion.span>
              <span className={`text-[11px] font-bold whitespace-nowrap ${i <= idx ? "text-slate-800" : "text-slate-400"}`}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="mx-1 mb-5 h-0.5 flex-1 overflow-hidden rounded bg-slate-200">
                <motion.div initial={{ width: 0 }} animate={{ width: i < idx ? "100%" : "0%" }} transition={{ duration: 0.5, delay: 0.2 + i * 0.12 }} className="h-full bg-emerald-500" />
              </div>
            )}
          </div>
        ))}
      </div>
      {status === "Perlu Klarifikasi" && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
          ⚠️ Petugas meminta klarifikasi tambahan — silakan jawab lewat Tanya Lanjutan di bawah.
        </motion.p>
      )}
    </div>
  );
}

export default function Lacak() {
  const [params] = useSearchParams();
  const [kode, setKode] = useState(params.get("kode") ?? "");
  const [verif, setVerif] = useState("");
  const [err, setErr] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const cari = (kodeVal?: string, verifVal?: string) => {
    const k = (kodeVal ?? kode).trim().toUpperCase();
    const vg = (verifVal ?? verif).trim();
    setErr("");
    if (!k) { setErr("Masukkan kode tiket terlebih dahulu."); return; }
    const t = getTicket(k);
    if (!t) { setErr("Kode tiket tidak ditemukan. Periksa kembali."); setTicket(null); return; }
    // sesi terverifikasi (mis. baru saja mengajukan) → lewati verifikasi
    if (isVerified(k)) { setTicket(t); return; }
    if (vg.length !== 4) { setErr("Wajib masukkan 4 digit terakhir No. WA / NIK untuk membuka tiket."); setTicket(null); return; }
    const okWa = last4(t.wa) === vg;
    const okNip = last4(t.nip) === vg;
    if (!okWa && !okNip) { setErr("4 digit verifikasi tidak cocok dengan WA / NIK tiket ini."); setTicket(null); return; }
    markVerified(k);
    setTicket(t);
  };

  useEffect(() => {
    const k = params.get("kode");
    if (k) {
      const ku = k.toUpperCase();
      setKode(ku);
      // auto-cari bila sesi ini sudah terverifikasi (alur Sukses → Lacak)
      if (isVerified(ku)) {
        const t = getTicket(ku);
        if (t) setTicket(t);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") cari();
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Reveal>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">🔍 Lacak Tiket Mandiri</h1>
        <p className="mt-1 text-sm text-slate-500">Masukkan kode tiket + <b>wajib</b> 4 digit terakhir WA/NIK untuk membuka jawaban & tanya lanjutan.</p>
      </Reveal>
      <Card className="mt-6 p-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
          <Field label="Kode Tiket *"><input value={kode} onChange={(e) => setKode(e.target.value.toUpperCase())} onKeyDown={onEnter} placeholder="KLN-XXXXXX" className={`${inputCls()} text-center font-mono font-bold tracking-widest`} /></Field>
          <Field label="4 Digit WA/NIK *"><input value={verif} onChange={(e) => setVerif(e.target.value.replace(/\D/g, "").slice(0, 4))} onKeyDown={onEnter} inputMode="numeric" placeholder="7890" className={`${inputCls()} text-center font-mono font-bold tracking-widest`} /></Field>
          <div className="flex items-end"><Button onClick={() => cari()}><Search size={15} /> Lacak</Button></div>
        </div>
        <AnimatePresence>
          {err && <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">{err}</motion.p>}
        </AnimatePresence>
      </Card>

      <AnimatePresence>
        {ticket && (
          <motion.div key={ticket.kode + ticket.jawaban.length} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-950 px-6 py-5 text-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-lg font-extrabold tracking-widest">{ticket.kode}</p>
                    <p className="text-xs text-slate-300">{ticket.namaPaket} • {ticket.skpk}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">Diajukan {formatTanggal(ticket.createdAt)} • {formatJam(ticket.createdAt)} • {ticket.bentuk}</p>
                  </div>
                  <div className="flex gap-2"><LayananBadge label={ticket.jenisLayanan} /><StatusBadge status={ticket.status} /></div>
                </div>
              </div>
              <div className="space-y-4 p-6">
                <Timeline status={ticket.status} />
                <div className="rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200">
                  <p className="text-xs font-bold text-slate-500">Uraian Anda</p>
                  <p className="mt-1 text-slate-700">{ticket.uraian}</p>
                  <p className="mt-2 text-xs font-bold text-slate-500">Pertanyaan</p>
                  <p className="text-slate-700">{ticket.pertanyaan}</p>
                </div>
                <TicketThread ticket={ticket} onUpdate={setTicket} />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
