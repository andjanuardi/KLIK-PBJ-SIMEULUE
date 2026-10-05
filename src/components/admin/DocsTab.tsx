import { AnimatePresence, motion } from "framer-motion";
import { Download, FileUp, Pencil, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Card, ConfirmDialog, Empty, Field, inputCls } from "../ui";
import { addDoc, deleteDoc, loadDocs, updateDoc } from "../../lib/store";
import type { DocItem } from "../../lib/store";

const KATEGORI = ["Dasar Hukum", "Template", "Panduan", "Etika", "Lainnya"];

function readFile(f: File, cb: (v: { name: string; dataUrl: string; size: string } | null, err?: string) => void): void {
  if (!["application/pdf", "image/png", "image/jpeg", "image/jpg"].includes(f.type)) { cb(null, "Hanya PDF / PNG / JPG."); return; }
  if (f.size > 2 * 1024 * 1024) { cb(null, "Maksimal 2MB (batas penyimpanan browser)."); return; }
  const r = new FileReader();
  r.onload = () => {
    const size = f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`;
    cb({ name: f.name, dataUrl: String(r.result), size });
  };
  r.readAsDataURL(f);
}

export default function DocsTab() {
  const [docs, setDocs] = useState<DocItem[]>(() => loadDocs());
  const [judul, setJudul] = useState("");
  const [kategori, setKategori] = useState("Panduan");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<{ name: string; dataUrl: string; size: string } | null>(null);
  const [mode, setMode] = useState<"file" | "url">("file");
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [eJudul, setEJudul] = useState("");
  const [eKategori, setEKategori] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eUrl, setEUrl] = useState("");
  const [eErr, setEErr] = useState("");
  const [deleting, setDeleting] = useState<DocItem | null>(null);

  const refresh = () => setDocs(loadDocs());

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return docs;
    return docs.filter((d) => `${d.judul} ${d.kategori} ${d.desc}`.toLowerCase().includes(s));
  }, [docs, q]);

  const onFile = (f: File | undefined) => {
    setErr("");
    if (!f) return;
    readFile(f, (v, e) => {
      if (e) { setErr(e); return; }
      setFile(v);
    });
  };

  const tambah = () => {
    setErr("");
    if (judul.trim().length < 3) { setErr("Judul minimal 3 karakter."); return; }
    if (mode === "file" && !file) { setErr("Wajib lampirkan file (PDF / PNG / JPG, maks 2MB)."); return; }
    if (mode === "url") {
      if (!/^https?:\/\/.+\..+/.test(url.trim())) { setErr("Wajib isi URL valid, cth: https://contoh.go.id/dok.pdf"); return; }
    }
    try {
      if (mode === "file" && file) {
        addDoc({ judul: judul.trim(), kategori, tag: kategori, desc: desc.trim() || "Dokumen referensi PBJ.", tipe: "file", fileName: file.name, dataUrl: file.dataUrl, size: file.size });
      } else {
        addDoc({ judul: judul.trim(), kategori, tag: kategori, desc: desc.trim() || "Dokumen referensi PBJ.", tipe: "url", url: url.trim() });
      }
    } catch {
      setErr("Gagal menyimpan — penyimpanan penuh. Hapus dokumen ber-file besar.");
      return;
    }
    setJudul(""); setDesc(""); setFile(null); setUrl("");
    refresh();
  };

  const mulaiEdit = (d: DocItem) => {
    setEditing(d.id);
    setEJudul(d.judul);
    setEKategori(d.kategori);
    setEDesc(d.desc);
    setEUrl(d.url ?? "");
    setEErr("");
  };

  const simpanEdit = (d: DocItem) => {
    setEErr("");
    if (eJudul.trim().length < 3) { setEErr("Judul minimal 3 karakter."); return; }
    if (d.tipe === "url" && !/^https?:\/\/.+\..+/.test(eUrl.trim())) { setEErr("URL tidak valid."); return; }
    try {
      updateDoc(d.id, {
        judul: eJudul.trim(),
        kategori: eKategori,
        tag: eKategori,
        desc: eDesc.trim() || "Dokumen referensi PBJ.",
        ...(d.tipe === "url" ? { url: eUrl.trim() } : {}),
      });
    } catch {
      setEErr("Gagal menyimpan — penyimpanan penuh.");
      return;
    }
    setEditing(null);
    refresh();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="h-fit space-y-3 p-5">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><FileUp size={15} /> Upload Dokumen</h3>
        <Field label="Judul *"><input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="cth: SE Kepala LKPP No. 3/2026" className={inputCls()} /></Field>
        <Field label="Kategori">
          <select value={kategori} onChange={(e) => setKategori(e.target.value)} className={inputCls()}>
            {KATEGORI.map((k) => <option key={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Deskripsi singkat"><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Isi dokumen…" className={inputCls()} /></Field>
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Sumber dokumen * (wajib salah satu)</span>
          <div className="mb-2 flex gap-2">
            {(["file", "url"] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setErr(""); }} className={`flex-1 cursor-pointer rounded-xl px-3 py-2 text-xs font-bold ring-1 transition ${mode === m ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}>
                {m === "file" ? "Upload File" : "Tautan URL"}
              </button>
            ))}
          </div>
          {mode === "file" ? (
            <div>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => onFile(e.target.files?.[0])} className="w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white" />
              <p className="mt-1 text-[11px] text-slate-400">PDF / PNG / JPG • maks 2MB</p>
              {file && <p className="mt-1.5 text-xs font-semibold text-emerald-700">📎 {file.name} • {file.size}</p>}
            </div>
          ) : (
            <div>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" className={inputCls()} />
              <p className="mt-1 text-[11px] text-slate-400">Tautan https — dibuka di tab baru</p>
            </div>
          )}
        </div>
        {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">{err}</p>}
        <Button onClick={tambah} className="w-full"><FileUp size={14} /> Tambah Dokumen</Button>
      </Card>
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <div className="relative">
            <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul / kategori…" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-xs outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">{filtered.length} dari {docs.length} dokumen</p>
        </div>
        <div className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
          {filtered.length === 0 && <div className="p-4"><Empty title="Tidak ada dokumen" desc="Coba kata kunci lain." /></div>}
          <AnimatePresence initial={false}>
            {filtered.map((d) => (
              <motion.div key={d.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {editing === d.id ? (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2.5 bg-emerald-50/50 px-5 py-4">
                    <Field label="Judul *"><input value={eJudul} onChange={(e) => setEJudul(e.target.value)} className={inputCls()} /></Field>
                    <div className="grid grid-cols-2 gap-2.5">
                      <Field label="Kategori">
                        <select value={eKategori} onChange={(e) => setEKategori(e.target.value)} className={inputCls()}>
                          {KATEGORI.map((k) => <option key={k}>{k}</option>)}
                        </select>
                      </Field>
                      <Field label="Deskripsi"><input value={eDesc} onChange={(e) => setEDesc(e.target.value)} className={inputCls()} /></Field>
                    </div>
                    {d.tipe === "url" && (
                      <Field label="URL *"><input value={eUrl} onChange={(e) => setEUrl(e.target.value)} inputMode="url" className={inputCls()} /></Field>
                    )}
                    {d.tipe === "file" && <p className="text-[11px] text-slate-400">Berkas: {d.fileName} ({d.size ?? "-"}) — ganti file belum didukung, hapus & tambah baru bila perlu.</p>}
                    {eErr && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">{eErr}</p>}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => simpanEdit(d)}>Simpan</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Batal</Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">{d.judul}</p>
                      <p className="truncate text-[11px] text-slate-400">{d.kategori} • {d.desc} {d.tipe === "file" && d.fileName ? `• ${d.fileName} (${d.size ?? ""})` : ""}{d.tipe === "url" && d.url ? `• ${d.url}` : ""}</p>
                    </div>
                    {d.tipe === "file" && d.dataUrl ? (
                      <a href={d.dataUrl} download={d.fileName ?? d.judul} className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"><Download size={13} /> Unduh</a>
                    ) : d.tipe === "url" && d.url ? (
                      <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100"><Download size={13} /> Buka</a>
                    ) : (
                      <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-400">Info saja</span>
                    )}
                    <button onClick={() => mulaiEdit(d)} className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Edit"><Pencil size={14} /></button>
                    <button onClick={() => setDeleting(d)} className="cursor-pointer rounded-lg p-2 text-rose-500 hover:bg-rose-50" title="Hapus"><Trash2 size={14} /></button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Card>
      <ConfirmDialog
        open={!!deleting}
        title="Hapus dokumen?"
        message={deleting ? `"${deleting.judul}" akan dihapus permanen dan tidak tampil lagi di halaman publik.` : undefined}
        confirmLabel="Ya, hapus"
        onCancel={() => setDeleting(null)}
        onConfirm={() => { if (deleting) { deleteDoc(deleting.id); setDeleting(null); refresh(); } }}
      />
    </div>
  );
}
