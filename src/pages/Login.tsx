import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Field, Reveal, inputCls } from "../components/ui";
import { loadUsers, setAdminSession } from "../lib/store";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@pbj.go.id");
  const [pass, setPass] = useState("admin123");
  const [err, setErr] = useState("");

  const login = () => {
    const u = loadUsers().find((a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.pass === pass);
    if (!u) { setErr("Email / password salah. Coba admin@pbj.go.id / admin123"); return; }
    if (u.aktif === false) { setErr("Akun ini dinonaktifkan. Hubungi admin."); return; }
    setAdminSession(u.email, u.role === "operator" ? "operator" : "admin", u.nama);
    nav("/admin");
  };

  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <Reveal>
        <Card className="p-8">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white"><ShieldCheck size={24} /></motion.div>
          <h1 className="mt-4 text-center text-xl font-extrabold text-slate-900">Login Petugas</h1>
          <p className="mt-1 text-center text-xs text-slate-500">Khusus admin & operator. Publik tidak perlu login.</p>
          <div className="mt-6 space-y-4">
            <Field label="Email"><input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls()} /></Field>
            <Field label="Password"><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} className={inputCls()} /></Field>
            {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">{err}</p>}
            <Button onClick={login} className="w-full">Masuk Dashboard</Button>
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-center text-[11px] text-slate-500 ring-1 ring-slate-200">Demo: <b>admin@pbj.go.id / admin123</b> • operator: <b>operator@pbj.go.id / operator123</b></p>
          </div>
        </Card>
      </Reveal>
    </main>
  );
}
