import seed from "../data/data-seed.json";
import type { Ticket } from "../types";
import { loadTickets, saveTickets } from "./store";

interface SeedReply {
  id: string;
  dari: "petugas" | "pemohon";
  teks: string;
  replyDaysAgo: number;
}

interface SeedTicket extends Omit<Ticket, "createdAt" | "updatedAt" | "jawaban" | "ringkasan"> {
  jawaban: SeedReply[];
  ringkasanDaysAgo?: number;
  createdDaysAgo: number;
  updatedDaysAgo: number;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9 + (n % 8), 12, 0, 0);
  return d.toISOString();
}

export function ensureSeed(): void {
  if (loadTickets().length > 0) return;
  const list: Ticket[] = (seed.tickets as SeedTicket[])
    .map((t) => {
      const { ringkasanDaysAgo, createdDaysAgo, updatedDaysAgo, ...rest } = t;
      const jawaban = rest.jawaban.map((r) => ({
        id: r.id,
        dari: r.dari,
        teks: r.teks === "JAWABAN_REF" ? seed.jawabanStandar : r.teks,
        createdAt: daysAgo(r.replyDaysAgo),
      }));
      // panjang ringkasan mengikuti batch asal (seed-x: 200, lainnya: 220)
      const cut = rest.id.startsWith("seed-x-") ? 200 : 220;
      return {
        ...rest,
        jawaban,
        ringkasan: ringkasanDaysAgo !== undefined ? seed.jawabanStandar.slice(0, cut) + seed.ringkasanSuffix : undefined,
        createdAt: daysAgo(createdDaysAgo),
        updatedAt: daysAgo(updatedDaysAgo),
      } as Ticket;
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  saveTickets(list);
}
