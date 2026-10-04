import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Plus, Trash2, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { Button, Card, Empty, Field, inputCls } from "../ui";
import { createUser, deleteUser, getAdminSession, loadUsers, updateUser } from "../../lib/store";
import type { AdminUser } from "../../types";

export default function UsersTab() {
  const me = getAdminSession();
  const [users, setUsers] = useState<AdminUser[]>(() => loadUsers());
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [role, setRole] = useState<"operator" | "admin">("operator");
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editPass, setEditPass] = useState("");

  const refresh = () => setUsers(loadUsers());

  const tambah = () => {
    setErr("");
    if (nama.trim().length < 3) { setErr("Nama minimal 3 karakter."); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setErr("Email tidak valid."); return; }
    if (pass.length < 6) { setErr("Password minimal 6 karakter."); return; }
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) { setErr("Email sudah terdaftar."); return; }
    createUser({ email: email.trim(), pass, nama: nama.trim(), role, aktif: true });
    setNama(""); setEmail(""); setPass("");
    refresh();
  };

  const toggleAktif = (u: AdminUser) => {
    if (u.email === me?.email) return;
    updateUser(u.id!, { aktif: u.aktif === false ? true : false });
    refresh();
  };

  const hapus = (u: AdminUser) => {
    if (u.email === me?.email) return;
    if (!confirm(`Hapus user ${u.email}?`)) return;
    deleteUser(u.id!);
    refresh();
  };

  const simpanPass = (u: AdminUser) => {
    if (editPass.length < 6) { setErr("Password baru minimal 6 karakter."); return; }
    updateUser(u.id!, { pass: editPass });
    setEditing(null); setEditPass(""); setErr("");
    refresh();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="h-fit space-y-3 p-5">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><Plus size={15} /> Tambah Operator</h3>
        <Field label="Nama"><input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama operator" className={inputCls()} /></Field>
        <Field label="Email"><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="operator@pbj.go.id" className={inputCls()} /></Field>
        <Field label="Password"><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="min. 6 karakter" className={inputCls()} /></Field>
        <Field label="Role">
          <select value={role} onChange={(e) => setRole(e.target.value as "operator" | "admin")} className={inputCls()}>
            <option value="operator">Operator (hanya kelola konsultasi)</option>
            <option value="admin">Admin (semua modul)</option>
          </select>
        </Field>
        {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">{err}</p>}
        <Button onClick={tambah} className="w-full"><Plus size={14} /> Buat User</Button>
      </Card>
      <Card className="overflow-hidden">
        <div className="divide-y divide-slate-100">
          {users.length === 0 && <div className="p-4"><Empty title="Belum ada user" /></div>}
          <AnimatePresence initial={false}>
            {users.map((u) => (
              <motion.div key={u.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-2 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{u.nama} {u.email === me?.email && <span className="text-[10px] text-emerald-600">(Anda)</span>}</p>
                  <p className="truncate font-mono text-[11px] text-slate-400">{u.email}</p>
                  <div className="mt-1 flex gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${u.role === "admin" ? "bg-blue-50 text-blue-700 ring-blue-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>{u.role}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${u.aktif === false ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}`}>{u.aktif === false ? "Nonaktif" : "Aktif"}</span>
                  </div>
                  {editing === u.id && (
                    <div className="mt-2 flex gap-2">
                      <input type="password" value={editPass} onChange={(e) => setEditPass(e.target.value)} placeholder="Password baru" className={`${inputCls()} !py-1.5 text-xs`} />
                      <button onClick={() => simpanPass(u)} className="shrink-0 cursor-pointer rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">Simpan</button>
                      <button onClick={() => { setEditing(null); setEditPass(""); }} className="shrink-0 cursor-pointer rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">Batal</button>
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => { setEditing(u.id!); setEditPass(""); }} disabled={u.email === me?.email} className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" title="Reset password"><Pencil size={14} /></button>
                  <button onClick={() => toggleAktif(u)} disabled={u.email === me?.email} className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" title={u.aktif === false ? "Aktifkan" : "Nonaktifkan"}>{u.aktif === false ? <UserCheck size={14} /> : <UserX size={14} />}</button>
                  <button onClick={() => hapus(u)} disabled={u.email === me?.email} className="cursor-pointer rounded-lg p-2 text-rose-500 hover:bg-rose-50 disabled:opacity-30" title="Hapus"><Trash2 size={14} /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
