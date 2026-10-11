import { useEffect, useState } from "react";
import Dokumen from "../components/Dokumen";
import Hero from "../components/Hero";
import TiketTable from "../components/TiketTable";
import { Empty } from "../components/ui";
import { ApiError, getTicketsPublic } from "../lib/api";
import type { Ticket } from "../types";

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let on = true;
    getTicketsPublic()
      .then((list) => { if (on) { setTickets(list); setLoading(false); } })
      .catch((e) => { if (on) { setErr(e instanceof ApiError ? e.message : "Gagal memuat data."); setLoading(false); } });
    return () => { on = false; };
  }, []);

  return (
    <div>
      <Hero tickets={tickets} loading={loading} />
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        {err && !loading && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-center">
            <p className="text-sm font-bold text-rose-700">{err}</p>
            <button onClick={() => window.location.reload()} className="mt-2 cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white">Coba lagi</button>
          </div>
        )}
        {!err && <TiketTable tickets={tickets} loading={loading} />}
        {err && !loading && <Empty title="Daftar konsultasi tidak dapat dimuat" desc="Periksa koneksi lalu coba lagi." />}
        <Dokumen loading={loading} />
      </main>
    </div>
  );
}
