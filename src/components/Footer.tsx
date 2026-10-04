import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import logoLKPP from "../assets/logo/Logo_1b.png";
import logoSimeulue from "../assets/logo/LOGO_KABUPATEN_SIMEULUE.png";
import logoSirup from "../assets/logo/logo-header-latihan.png";
import logoSPSE from "../assets/logo/logo-spse.svg";
import { DEFAULT_SETTINGS, loadSettings } from "../lib/store";
import { LAYANAN } from "../types";

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/ajukan", label: "Ajukan Konsultasi" },
  { to: "/lacak", label: "Lacak Tiket" },
];

const TAUTAN = [
  { nama: "Pemkab Simeulue", url: "https://simeuluekab.go.id/", logo: logoSimeulue },
  { nama: "LKPP RI", url: "https://www.lkpp.go.id/", logo: logoLKPP },
  { nama: "SIRUP Inaproc", url: "https://sirup.inaproc.id/", logo: logoSirup },
  { nama: "SPSE Simeulue", url: "https://spse.inaproc.id/simeuluekab", logo: logoSPSE },
];

export default function Footer() {
  return (
    <motion.footer initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-14 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-2">
          <p className="font-extrabold text-slate-900">KLIK-PBJ Simeulue</p>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-500">Klinik Layanan Integrasi Konsultasi Pengadaan Barang dan Jasa — Kab. Simeulue. Tanggapan bersifat konsultatif, bukan pengambilalihan kewenangan pejabat berwenang.</p>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Layanan</p>
          <ul className="mt-2 space-y-1">
            {LAYANAN.map((l, i) => (
              <motion.li key={l} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Link
                  to={`/ajukan?layanan=${encodeURIComponent(l)}`}
                  className="group inline-flex items-center gap-1 rounded-lg px-1 py-1 text-xs font-semibold text-slate-500 transition hover:translate-x-0.5 hover:text-emerald-700"
                >
                  {l}
                  <ArrowUpRight size={12} className="opacity-0 transition group-hover:opacity-100" />
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Navigasi</p>
          <ul className="mt-2 space-y-1">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="inline-block rounded-lg px-1 py-1 text-xs font-semibold text-slate-500 transition hover:translate-x-0.5 hover:text-emerald-700">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-bold text-slate-800">Jam Layanan</p>
          <p className="mt-1 text-xs text-slate-500">{loadSettings().jamLayanan || DEFAULT_SETTINGS.jamLayanan}</p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-8">
        <p className="mb-3 text-xs font-bold tracking-widest text-slate-400 uppercase">🔗 Tautan Resmi</p>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          {TAUTAN.map((t, i) => (
            <motion.a
              key={t.url}
              href={t.url}
              target="_blank"
              rel="noreferrer"
              title={t.nama}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <img src={t.logo} alt={t.nama} loading="lazy" className="h-10 w-auto object-contain transition md:h-12" />
            </motion.a>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-[11px] text-slate-400">© 2026 KLIK-PBJ Simeulue • Pemerintah Kabupaten Simeulue</div>
    </motion.footer>
  );
}
