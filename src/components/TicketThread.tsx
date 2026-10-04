import { AnimatePresence, motion } from "framer-motion";
import { SendHorizonal } from "lucide-react";
import { useState } from "react";
import type { Ticket } from "../types";
import { addReply } from "../lib/store";
import { formatJam, formatTanggal } from "../lib/masking";

export default function TicketThread({ ticket, onUpdate }: { ticket: Ticket; onUpdate: (t: Ticket) => void }) {
  const [teks, setTeks] = useState("");
  const [sent, setSent] = useState(false);

  const kirim = () => {
    if (teks.trim().length < 5) return;
    const t = addReply(ticket.kode, { dari: "pemohon", teks: teks.trim() });
    if (t) {
      onUpdate(t);
      setTeks("");
      setSent(true);
      setTimeout(() => setSent(false), 2500);
    }
  };

  return (
    <div>
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {ticket.jawaban.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">
              ⏳ Tiket Anda sedang ditelaah petugas. Jawaban akan muncul di sini.
            </motion.div>
          )}
          {ticket.jawaban.map((r) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${r.dari === "petugas" ? "bg-emerald-600 text-white" : "ml-auto bg-white text-slate-700 ring-1 ring-slate-200"}`}
            >
              <p className={`mb-1 text-[11px] font-bold ${r.dari === "petugas" ? "text-emerald-100" : "text-slate-400"}`}>
                {r.dari === "petugas" ? "✅ Petugas PBJ" : "👤 Anda"} • {formatTanggal(r.createdAt)} • {formatJam(r.createdAt)}
              </p>
              <p className="whitespace-pre-wrap">{r.teks}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
        <p className="mb-2 text-xs font-bold text-slate-600">💬 Tanya Lanjutan</p>
        <div className="flex gap-2">
          <input value={teks} onChange={(e) => setTeks(e.target.value)} onKeyDown={(e) => e.key === "Enter" && kirim()} placeholder="Tulis pertanyaan lanjutan…" className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={kirim} className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
            <SendHorizonal size={15} /> Kirim
          </motion.button>
        </div>
        <AnimatePresence>
          {sent && <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-xs font-semibold text-emerald-700">✓ Terkirim — status tiket kembali “Dalam Proses”.</motion.p>}
        </AnimatePresence>
      </div>
    </div>
  );
}
