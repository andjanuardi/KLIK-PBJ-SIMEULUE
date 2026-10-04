import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { inputCls } from "./ui";

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  hasError?: boolean;
}

/** Combobox searchable: ketik untuk filter, klik untuk pilih */
export default function SearchSelect({ value, onChange, options, placeholder, hasError }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value ?? "");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value ?? ""), [value]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const list = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return options;
    return options.filter((o) => o.toLowerCase().includes(s));
  }, [options, query]);

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <input
          value={open ? query : value || query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(""); }}
          onFocus={() => { setQuery(value ?? ""); setOpen(true); }}
          placeholder={placeholder}
          className={`${inputCls(hasError)} pr-9`}
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="buka daftar"
        >
          <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.18 }}
            className="absolute z-30 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
          >
            {list.length === 0 && (
              <li className="flex items-center gap-2 px-3 py-2.5 text-xs text-slate-400">
                <Search size={13} /> Tidak ditemukan — coba kata kunci lain
              </li>
            )}
            {list.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  onClick={() => { onChange(o); setQuery(o); setOpen(false); }}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition ${value === o ? "bg-emerald-50 font-bold text-emerald-800" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <span className="flex-1">{o}</span>
                  {value === o && <Check size={14} className="shrink-0 text-emerald-600" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
