/** Masking identitas untuk tabel publik (PRD §6 Fase 1 — privasi) */
export function maskNama(nama: string): string {
  if (!nama) return "***";
  const parts = nama.trim().split(/\s+/);
  const first = parts[0] ?? "";
  if (first.length <= 2) return `${first}***`;
  return `${first.slice(0, Math.min(5, first.length))} ***`;
}

export function maskNip(nip: string): string {
  const digits = (nip ?? "").replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `${digits.slice(0, 4)}**********`;
}

export function maskWa(wa: string): string {
  const digits = (wa ?? "").replace(/\D/g, "");
  if (digits.length < 4) return "**********";
  return `${digits.slice(0, 4)}**********`;
}

export function last4(s: string): string {
  const digits = (s ?? "").replace(/\D/g, "");
  return digits.slice(-4);
}

export function formatTanggal(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatJam(iso: string): string {
  try {
    return (
      new Date(iso)
        .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" })
        .replace(":", ".") + " WIB"
    );
  } catch {
    return "";
  }
}

export function formatRupiah(v?: string): string {
  if (!v) return "-";
  const n = Number(String(v).replace(/[^\d]/g, ""));
  if (!n) return v;
  return "Rp " + n.toLocaleString("id-ID");
}
