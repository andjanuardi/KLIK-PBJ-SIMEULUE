import { useEffect, useState } from "react";
import Dokumen from "../components/Dokumen";
import Hero from "../components/Hero";
import TiketTable from "../components/TiketTable";
import { loadTickets } from "../lib/store";
import { ensureSeed } from "../lib/seed";
import type { Ticket } from "../types";

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureSeed();
    // simulasi fetch <1.5s (NFR performa)
    const t = setTimeout(() => {
      setTickets(loadTickets());
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      <Hero tickets={tickets} loading={loading} />
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <TiketTable tickets={tickets} loading={loading} />
        <Dokumen loading={loading} />
      </main>
    </div>
  );
}
