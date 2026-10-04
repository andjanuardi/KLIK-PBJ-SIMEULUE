import { AnimatePresence, motion } from "framer-motion";
import { Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import logoDefault from "../assets/logo.png";
import { getAdminSession, loadSettings } from "../lib/store";

const LINKS = [
  { to: "/", label: "Beranda" },
  { to: "/ajukan", label: "Ajukan Konsultasi" },
  { to: "/lacak", label: "Lacak Tiket" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const admin = getAdminSession();
  const logo = loadSettings().logoDataUrl || logoDefault;
  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={isHome ? "absolute inset-x-0 top-0 z-40 border-b border-white/10 bg-transparent" : "sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl"}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="group flex items-center gap-2.5">
          <motion.img src={logo} alt="Logo KLIK-PBJ Simeulue" whileHover={{ rotate: -4, scale: 1.06 }} className="h-11 w-11 rounded-2xl bg-white object-cover shadow-lg ring-1 ring-white/30" />
          <span className="leading-tight">
            <span className="block text-[15px] font-extrabold tracking-tight text-white">KLIK-PBJ SIMEULUE</span>
            <span className="block text-[11px] font-medium text-emerald-300">Klinik Layanan Integrasi Konsultasi PBJ</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-xl px-4 py-2 text-sm font-semibold transition ${isActive ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <button
            onClick={() => nav(admin ? "/admin" : "/admin/login")}
            className="ml-2 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/20"
          >
            <ShieldCheck size={15} /> {admin ? "Dashboard" : "Petugas"}
          </button>
        </nav>
        <button onClick={() => setOpen((v) => !v)} className="rounded-xl p-2 text-white hover:bg-white/10 md:hidden" aria-label="menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => `block rounded-xl px-4 py-2.5 text-sm font-semibold ${isActive ? "bg-white/15 text-white" : "text-slate-300"}`}
                >
                  {l.label}
                </NavLink>
              ))}
              <button onClick={() => { setOpen(false); nav(admin ? "/admin" : "/admin/login"); }} className="block w-full rounded-xl bg-white/10 px-4 py-2.5 text-left text-sm font-semibold text-white ring-1 ring-white/20">
                {admin ? "Dashboard Petugas" : "Login Petugas"}
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
