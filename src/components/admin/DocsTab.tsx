import { AnimatePresence, motion } from "framer-motion";
import { Download, FileUp, Pencil, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card, ConfirmDialog, Empty, Field, inputCls } from "../ui";
import { ApiError, addDoc, deleteDoc, getDocs, updateDoc, uploadFile } from "../../lib/api";
import type { DocItem } from "../../lib/store";

const KATEGORI = ["Dasar Hukum", "Template", "Panduan", "Etika", "Lainnya"];

export default function DocsTab() {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [judul, setJudul] = useState("");
  const [kategori, setKategori] = useState("Panduan");
  const [desc, setDesc] = useState("");
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [mode, setMode] = useState<"file" | "url">("file");
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [eJudul, setEJudul] = useState("");
  const [eKategori, setEKategori] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eUrl, setEUrl] = useState("");
  const [eErr, setEErr] = useState("");
  const [deleting, setDeleting] = useState<DocItem | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const refresh = async () => {
    try {
      setDocs(await getDocs());
      setLoadErr("");
    } catch (e) {
      setLoadErr(e instanceof ApiError ? e.message : "Gagal memuat dokumen.");
    }
  };

  useEffect(() => {
    let on = true;
    setLoading(true);
    refresh().finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = (() => {
    const s = q.trim().toLowerCase();
    if (!s) return docs;
    return docs.filter((d) => `${d.judul} ${d.kategori} ${d.desc}`.toLowerCase().includes(s));
  })();

  const onFile = (f: File | undefined) => {
    setErr("");
    if (!f) return;
    if (!["application/pdf", "image/png", "image/jpeg", "image/jpg"].includes(f.type)) { setErr("Hanya PDF / PNG / JPG."); return; }
    if (f.size > 2 * 1024 * 1024) { setErr("Maksimal 2MB."); return; }
    setFileObj(f);
  };

  const tambah = async () => {
    if (busy) return;
    setErr("");
    if (judul.trim().length < 3) { setErr("Judul minimal 3 karakter."); return; }
    if (mode === "file" && !fileObj) { setErr("Wajib lampirkan file (PDF / PNG / JPG, maks 2MB)."); return; }
    if (mode === "url" && !/^https?:\/\/.+\..+/.test(url.trim())) { setErr("Wajib isi URL valid, cth: https://contoh.go.id/dok.pdf"); return; }
    setBusy(true);
    try {
      if (mode === "file" && fileObj) {
        // nama file = judul dokumen (ekstensi tidak digandakan)
        const m = /\.([A-Za-z0-9]{1,5})$/.exec(fileObj.name.trim());
        const ext = m ? `.${m[1].toLowerCase()}` : ".pdf";
        const base = judul.trim().slice(0, 120);
        const newName = base.toLowerCase().endsWith(ext) ? base : base + ext;
        const up = await uploadFile(fileObj, newName);
        const mb = fileObj.size > 1024 * 1024 ? `${(fileObj.size / 1024 / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(fileObj.size / 1024))} KB`;
        await addDoc({ judul: judul.trim(), kategori, desc: desc.trim() || "Dokumen referensi PBJ.", tipe: "file", fileName: newName, driveId: up.fileId, size: mb });
      } else {
        await addDoc({ judul: judul.trim(), kategori, desc: desc.trim() || "Dokumen referensi PBJ.", tipe: "url", url: url.trim() });
      }
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Gagal menyimpan.");
      setBusy(false);
      return;
    }
    setBusy(false);
    setJudul(""); setDesc(""); setFileObj(null); setUrl("");
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

  const simpanEdit = async (d: DocItem) => {
    if (editBusy) return;
    setEErr("");
    if (eJudul.trim().length < 3) { setEErr("Judul minimal 3 karakter."); return; }
    if (d.tipe === "url" && !/^https?:\/\/.+\..+/.test(eUrl.trim())) { setEErr("URL tidak valid."); return; }
    setEditBusy(true);
    try {
      await updateDoc(d.id, {
        judul: eJudul.trim(),
        kategori: eKategori,
        desc: eDesc.trim() || "Dokumen referensi PBJ.",
        ...(d.tipe === "url" ? { url: eUrl.trim() } : {}),
      });
    } catch (e) {
      setEErr(e instanceof ApiError ? e.message : "Gagal menyimpan.");
      setEditBusy(false);
      return;
    }
    setEditBusy(false);
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
              <p className="mt-1 text-[11px] text-slate-400">PDF / PNG / JPG • maks 2MB • tersimpan di Drive</p>
              {fileObj && <p className="mt-1.5 text-xs font-semibold text-emerald-700">📎 {fileObj.name}</p>}
            </div>
          ) : (
            <div>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" className={inputCls()} />
              <p className="mt-1 text-[11px] text-slate-400">Tautan https — dibuka di tab baru</p>
            </div>
          )}
        </div>
        {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">{err}</p>}
        <Button onClick={tambah} disabled={busy} className="w-full"><FileUp size={14} /> {busy ? "Menyimpan…" : "Tambah Dokumen"}</Button>
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
          {loading && <p className="p-5 text-xs text-slate-400">Memuat dokumen…</p>}
          {!loading && loadErr && <div className="p-4"><Empty title="Gagal memuat dokumen" desc={loadErr} /></div>}
          {!loading && !loadErr && filtered.length === 0 && <div className="p-4"><Empty title="Tidak ada dokumen" desc="Coba kata kunci lain." /></div>}
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
                      <Button size="sm" onClick={() => simpanEdit(d)} disabled={editBusy}>{editBusy ? "Menyimpan…" : "Simpan"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)} disabled={editBusy}>Batal</Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">{d.judul}</p>
                      <p className="truncate text-[11px] text-slate-400">{d.kategori} • {d.desc} {d.tipe === "file" && d.fileName ? `• ${d.fileName} (${d.size ?? ""})` : ""}{d.tipe === "url" && d.url ? `• ${d.url}` : ""}</p>
                    </div>
                    {d.tipe === "file" && d.url ? (
                      <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"><Download size={13} /> Unduh</a>
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
        message={deleting ? `"${deleting.judul}" akan dihapus permanen.` : undefined}
        confirmLabel="Ya, hapus"
        busy={deletingBusy}
        onCancel={() => { if (!deletingBusy) setDeleting(null); }}
        onConfirm={async () => {
          if (!deleting || deletingBusy) return;
          setDeletingBusy(true);
          try {
            await deleteDoc(deleting.id);
          } catch (e) {
            setErr(e instanceof ApiError ? e.message : "Gagal menghapus.");
          }
          setDeletingBusy(false);
          setDeleting(null);
          refresh();
        }}
      />
    </div>
  );
}
