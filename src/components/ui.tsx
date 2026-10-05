import { AnimatePresence, motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useEffect } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
}
export function Button({ variant = "primary", size = "md", className, children, ...rest }: BtnProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={clsx(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-7 py-3.5 text-base",
        variant === "primary" && "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700",
        variant === "secondary" && "bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/25 hover:bg-amber-300",
        variant === "dark" && "bg-slate-900 text-white shadow-lg hover:bg-slate-800",
        variant === "ghost" && "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
        className
      )}
      {...(rest as object)}
    >
      {children}
    </motion.button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_-12px_rgba(2,6,23,0.15)]", className)}>
      {children}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  Selesai: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Dalam Proses": "bg-amber-50 text-amber-700 ring-amber-200",
  "Perlu Klarifikasi": "bg-rose-50 text-rose-700 ring-rose-200",
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1", STATUS_STYLE[status] ?? "bg-slate-100 text-slate-600 ring-slate-200")}>
      <span className={clsx("h-1.5 w-1.5 rounded-full", status === "Selesai" ? "bg-emerald-500" : status === "Dalam Proses" ? "bg-amber-500" : "bg-rose-500")} />
      {status}
    </span>
  );
}

const LAYANAN_STYLE: Record<string, string> = {
  "Pengadaan Barang": "bg-blue-50 text-blue-700 ring-blue-200",
  "Jasa Konstruksi": "bg-orange-50 text-orange-700 ring-orange-200",
  "Jasa Konsultansi": "bg-violet-50 text-violet-700 ring-violet-200",
  "Jasa Lainnya": "bg-teal-50 text-teal-700 ring-teal-200",
  "Pasca Kontrak": "bg-rose-50 text-rose-700 ring-rose-200",
};
export function LayananBadge({ label }: { label: string }) {
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1", LAYANAN_STYLE[label] ?? "bg-slate-100 text-slate-600 ring-slate-200")}>
      {label}
    </span>
  );
}

export function Field({ label, error, children, hint }: { label: string; error?: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
      {error && (
        <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="mt-1 block text-xs font-medium text-rose-600">
          {error}
        </motion.span>
      )}
    </label>
  );
}

export const inputCls = (err?: boolean) =>
  clsx(
    "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4",
    err ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-100"
  );

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton-shimmer rounded-xl", className)} />;
}

export function Empty({ title, desc }: { title: string; desc?: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow">📋</div>
      <p className="font-bold text-slate-700">{title}</p>
      {desc && <p className="max-w-sm text-sm text-slate-500">{desc}</p>}
    </motion.div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Hapus", onConfirm, onCancel }: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200">
              <Trash2 size={22} />
            </div>
            <p className="mt-3 text-base font-extrabold text-slate-900">{title}</p>
            {message && <p className="mt-1 text-sm leading-relaxed text-slate-500">{message}</p>}
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" onClick={onCancel} className="flex-1">Batal</Button>
              <button
                onClick={onConfirm}
                autoFocus
                className="flex-1 cursor-pointer rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 transition-colors hover:bg-rose-700"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
