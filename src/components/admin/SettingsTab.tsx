import { motion } from "framer-motion";
import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card, Field, inputCls } from "../ui";
import { ApiError, getSettings, saveSettings, uploadFile } from "../../lib/api";
import { DEFAULT_SETTINGS } from "../../lib/store";
import type { SiteSettings } from "../../lib/store";
import { LAYANAN } from "../../types";

export default function SettingsTab() {
  const [s, setS] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [baru, setBaru] = useState("");
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    let on = true;
    getSettings()
      .then((v) => { if (on) { setS(v); setLoading(false); } })
      .catch((e) => { if (on) { setErr(e instanceof ApiError ? e.message : "Gagal memuat pengaturan."); setLoading(false); } });
    return () => { on = false; };
  }, []);

  const set = (p: Partial<typeof s>) => { setS((v) => ({ ...v, ...p })); setSaved(false); };

  // Logo disimpan di Drive (URL thumbnail pendek), bukan base64 — sel Sheets maks ~50rb karakter.
  const onLogo = async (f: File | undefined) => {
    setErr("");
    if (!f || uploadingLogo) return;
    if (!["image/png", "image/jpeg", "image/jpg"].includes(f.type)) { setErr("Logo hanya PNG / JPG."); return; }
    if (f.size > 1024 * 1024) { setErr("Logo maksimal 1MB."); return; }
    setUploadingLogo(true);
    try {
      const m = /\.([A-Za-z0-9]{1,5})$/.exec(f.name.trim());
      const ext = (m ? m[1] : "png").toLowerCase();
      const up = await uploadFile(f, `logo-klik-pbj.${ext}`);
      set({ logoDataUrl: `https://drive.google.com/thumbnail?id=${up.fileId}&sz=w500` });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Gagal mengunggah logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const tambahLayanan = () => {
    const v = baru.trim();
    if (v.length < 3) { setErr("Nama layanan minimal 3 karakter."); return; }
    if ([...LAYANAN, ...s.layananCustom].some((x) => x.toLowerCase() === v.toLowerCase())) { setErr("Layanan sudah ada."); return; }
    set({ layananCustom: [...s.layananCustom, v] });
    setBaru(""); setErr("");
  };

  const simpan = async () => {
    if (saving) return;
    setErr("");
    setSaving(true);
    try {
      await saveSettings(s);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Gagal menyimpan. Periksa koneksi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-2 text-xs text-slate-400">Memuat pengaturan…</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-extrabold text-slate-900">🎨 Logo & Section Pertama</h3>
        <div className="flex items-center gap-4">
          {(s.logoDataUrl) ? (
            <img src={s.logoDataUrl} alt="Logo custom" className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">🖼️</span>
          )}
          <div>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-700">
              <ImagePlus size={13} /> {s.logoDataUrl ? "Ganti logo" : "Upload logo"}
              <input type="file" accept=".png,.jpg,.jpeg" onChange={(e) => onLogo(e.target.files?.[0])} className="hidden" />
            </label>
            {s.logoDataUrl && <button onClick={() => set({ logoDataUrl: undefined })} className="ml-2 cursor-pointer text-xs font-bold text-rose-600 hover:underline">Kembalikan default</button>}
            <p className="mt-1 text-[11px] text-slate-400">PNG/JPG ≤ 1MB • tersimpan di Drive • tampil di Navbar & Hero{uploadingLogo ? " • mengunggah…" : ""}</p>
          </div>
        </div>
        <Field label="Judul Hero"><input value={s.heroTitle ?? ""} onChange={(e) => set({ heroTitle: e.target.value })} className={inputCls()} /></Field>
        <Field label="Subjudul Hero"><input value={s.heroSubtitle ?? ""} onChange={(e) => set({ heroSubtitle: e.target.value })} className={inputCls()} /></Field>
        <Field label="Teks info (tampil di bawah subjudul)" hint="Kosongkan untuk menyembunyikan blok"><textarea value={s.infoText ?? ""} onChange={(e) => set({ infoText: e.target.value })} rows={2} placeholder="cth: Visi 2030: Mewujudkan Simeulue yang bermartabat…" className={inputCls()} /></Field>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Teks disclaimer (marquee bawah hero)</span>
            <button type="button" onClick={() => set({ disclaimerAktif: s.disclaimerAktif === false })} className={`flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full px-0.5 transition-colors ${s.disclaimerAktif === false ? "justify-start bg-slate-300" : "justify-end bg-emerald-500"}`} aria-label="aktifkan disclaimer" aria-pressed={s.disclaimerAktif !== false}>
              <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }} className="h-5 w-5 rounded-full bg-white shadow" />
            </button>
          </div>
          <textarea value={s.disclaimerText ?? ""} onChange={(e) => set({ disclaimerText: e.target.value })} rows={4} placeholder="Tulis teks disclaimer…" className={inputCls()} />
          <p className="mt-1 text-[11px] text-slate-400">{s.disclaimerAktif === false ? "Nonaktif — marquee disembunyikan" : "Aktif — berjalan di bawah hero"}</p>
        </div>
      </Card>
      <div className="space-y-4">
        <Card className="space-y-3 p-5">
          <h3 className="text-sm font-extrabold text-slate-900">🏷️ Jenis Layanan Kustom</h3>
          <p className="text-[11px] text-slate-400">Bawaan: {LAYANAN.join(" • ")}. Kustom tampil di akses cepat, form & filter.</p>
          <div className="flex gap-2">
            <input value={baru} onChange={(e) => setBaru(e.target.value)} onKeyDown={(e) => e.key === "Enter" && tambahLayanan()} placeholder="cth: Pengadaan Darurat" className={inputCls()} />
            <Button size="sm" onClick={tambahLayanan}><Plus size={14} /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {s.layananCustom.length === 0 && <span className="text-xs text-slate-400">Belum ada layanan kustom.</span>}
            {s.layananCustom.map((l) => (
              <motion.span key={l} layout className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 py-1 pr-1.5 pl-3.5 text-xs font-bold text-white">
                {l}
                <button onClick={() => set({ layananCustom: s.layananCustom.filter((x) => x !== l) })} className="cursor-pointer rounded-full bg-white/20 p-1 hover:bg-white/30" aria-label={`hapus ${l}`}><Trash2 size={11} /></button>
              </motion.span>
            ))}
          </div>
        </Card>
        <Card className="space-y-3 p-5">
          <h3 className="text-sm font-bold text-slate-900">Jam Layanan (Footer)</h3>
          <Field label="Teks jam layanan"><input value={s.jamLayanan ?? ""} onChange={(e) => set({ jamLayanan: e.target.value })} className={inputCls()} /></Field>
          {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">{err}</p>}
        </Card>
      </div>
      <div className="mt-4 lg:col-span-2">
        <Button onClick={simpan} disabled={saving} className="w-full !py-3.5 text-sm shadow-xl"><Save size={15} /> {saving ? "Menyimpan…" : saved ? "Tersimpan! ✓" : "Simpan Semua Pengaturan"}</Button>
      </div>
    </div>
  );
}
