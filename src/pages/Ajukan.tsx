import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Eraser, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Button, Card, Field, Reveal, inputCls } from "../components/ui";
import SearchSelect from "../components/SearchSelect";
import { formatRupiah, maskNip, maskWa } from "../lib/masking";
import { DAFTAR_JABATAN, DAFTAR_SKPK } from "../lib/referensi";
import { createTicket, markVerified } from "../lib/store";
import { BENTUK_KONSULTASI, METODE, TAHAPAN } from "../types";
import { getAllLayanan } from "../lib/store";

const DRAFT_KEY = "klinik_pbj_draft_v1";

const schema = z.object({
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  nip: z.string().regex(/^\d{16,18}$/, "NIP/NIK harus 16–18 digit angka"),
  jabatan: z.string().refine((jabatan) => DAFTAR_JABATAN.includes(jabatan), { message: "Pilih jabatan dari daftar yang tersedia" }),
  skpk: z.string().refine((skpk) => DAFTAR_SKPK.includes(skpk), { message: "Pilih SKPK dari daftar 45 instansi" }),
  wa: z.string().regex(/^(\+62|08)\d{8,13}$/, "Format WA: 08… / +62…"),
  jenisLayanan: z.string().refine((layanan) => getAllLayanan().includes(layanan), { message: "Pilih jenis layanan yang tersedia" }),
  tahapan: z.string().min(1, "Pilih tahapan"),
  metode: z.string().min(1, "Pilih metode"),
  namaPaket: z.string().min(5, "Nama paket minimal 5 karakter"),
  nilai: z.string().optional(),
  uraian: z.string().min(50, "Uraian minimal 50 karakter — jelaskan kronologi & kendala"),
  pertanyaan: z.string().min(10, "Tulis pertanyaan / solusi yang diharapkan"),
  bentuk: z.enum(BENTUK_KONSULTASI),
  fileName: z.string().optional(),
  setuju: z.boolean().refine((v) => v === true, { message: "Centang persetujuan disclaimer untuk mengirim" }),
});
type FormVal = z.infer<typeof schema>;

const STEPS = ["Identitas Pemohon", "Informasi Pengadaan", "Uraian & Lampiran", "Review & Kirim"];

function digitsOnly(s: string): string {
  return (s ?? "").replace(/\D/g, "");
}

function formatNilaiInput(raw?: string): string {
  const d = digitsOnly(raw ?? "");
  if (!d) return "";
  return "Rp " + Number(d).toLocaleString("id-ID");
}

export default function Ajukan() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [fileErr, setFileErr] = useState("");
  const [preset, setPreset] = useState<string | null>(null);
  const [draftInfo, setDraftInfo] = useState(false);
  const saveTimer = useRef<number | undefined>(undefined);
  const { register, handleSubmit, trigger, watch, setValue, getValues, reset, formState: { errors, isValid } } = useForm<FormVal>({
    resolver: zodResolver(schema),
    defaultValues: { jenisLayanan: "Pengadaan Barang", bentuk: "Jawaban/penjelasan tertulis", tahapan: "Pemilihan", metode: "E-Purchasing", setuju: false },
    mode: "onTouched",
  });

  // pulihkan draft (kecuali preset layanan dari URL menang)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && typeof d === "object") {
          reset({ jenisLayanan: "Pengadaan Barang", bentuk: "Jawaban/penjelasan tertulis", tahapan: "Pemilihan", metode: "E-Purchasing", ...d, setuju: false });
          setDraftInfo(true);
        }
      }
    } catch { /* abaikan draft rusak */ }
    const l = params.get("layanan");
    if (l && getAllLayanan().includes(l)) {
      setValue("jenisLayanan", l);
      setPreset(l);
      setStep(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // autosave draft (debounce 500ms)
  const all = watch();
  useEffect(() => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        const v = getValues();
        const { setuju: _s, ...rest } = v;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
      } catch { /* storage penuh — abaikan */ }
    }, 500);
    return () => window.clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ ...all, setuju: undefined })]);

  const uraianLen = (watch("uraian") ?? "").length;
  const uraianOk = uraianLen >= 50;

  const next = async () => {
    const fields: (keyof FormVal)[][] = [
      ["nama", "nip", "jabatan", "skpk", "wa"],
      ["jenisLayanan", "tahapan", "metode", "namaPaket"],
      ["uraian", "pertanyaan", "bentuk"],
    ];
    const ok = await trigger(fields[step]);
    if (ok) setStep((s) => Math.min(3, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [preview, setPreview] = useState<{ url: string; kind: "image" | "pdf"; size: string } | null>(null);

  const onFile = (f: File | undefined) => {
    setFileErr("");
    if (!f) return;
    const okType = ["application/pdf", "image/png", "image/jpeg", "image/jpg"].includes(f.type);
    if (!okType) { setFileErr("Hanya PDF / PNG / JPG."); return; }
    if (f.size > 10 * 1024 * 1024) { setFileErr("Maksimal 10MB."); return; }
    setValue("fileName", f.name, { shouldValidate: true });
    if (preview) URL.revokeObjectURL(preview.url);
    const mb = f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`;
    setPreview({
      url: URL.createObjectURL(f),
      kind: f.type === "application/pdf" ? "pdf" : "image",
      size: mb,
    });
  };

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setValue("fileName", "", { shouldValidate: true });
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    reset({ jenisLayanan: "Pengadaan Barang", bentuk: "Jawaban/penjelasan tertulis", tahapan: "Pemilihan", metode: "E-Purchasing", setuju: false, nama: "", nip: "", jabatan: "", skpk: "", wa: "", namaPaket: "", nilai: "", uraian: "", pertanyaan: "", fileName: "" });
    setStep(0);
    setPreset(null);
    setDraftInfo(false);
  };

  const submit = (v: FormVal) => {
    const { setuju: _s, ...rest } = v;
    const t = createTicket({ ...rest, nilai: digitsOnly(v.nilai ?? "") || undefined });
    localStorage.removeItem(DRAFT_KEY);
    markVerified(t.kode);
    nav(`/sukses/${t.kode}`, { state: { wa: v.wa } });
  };

  const v = getValues();
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">📝 Ajukan Konsultasi</h1>
            <p className="mt-1 text-sm text-slate-500">Tanpa login & tanpa captcha — selesai dalam &lt; 2 menit. Langsung dapat Kode Tiket Unik.</p>
          </div>
          <button onClick={clearDraft} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50">
            <Eraser size={13} /> Hapus draft
          </button>
        </div>
        {preset && (
          <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
            ⚡ Kategori terpilih: {preset} — terkunci sesuai akses cepat
          </motion.p>
        )}
        {draftInfo && !preset && (
          <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 ring-1 ring-blue-200">
            💾 Draft terakhir dipulihkan otomatis — lanjutkan pengisian
          </motion.p>
        )}
      </Reveal>

      <div className="mt-6 mb-2 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => { if (i < step) setStep(i); }}
              disabled={i >= step}
              className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-xs font-extrabold transition ${i < step ? "bg-emerald-600 text-white hover:bg-emerald-500" : i === step ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}
              title={i < step ? `Kembali ke ${s}` : s}
            >
              {i < step ? "✓" : i + 1}
            </button>
            <span className={`hidden text-xs font-bold sm:block ${i === step ? "text-slate-900" : "text-slate-400"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="h-0.5 flex-1 overflow-hidden rounded bg-slate-200"><motion.div animate={{ width: i < step ? "100%" : "0%" }} className="h-full bg-emerald-500" /></div>}
          </div>
        ))}
      </div>
      <div className="mb-6 h-1 overflow-hidden rounded-full bg-slate-100">
        <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
      </div>

      <Card className="overflow-hidden p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35 }}>
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-1"><Field label="Nama Pemohon *" error={errors.nama?.message}><input {...register("nama")} placeholder="cth: Ahmad Fauzi" className={inputCls(!!errors.nama)} /></Field></div>
                <div className="sm:col-span-1"><Field label="NIP / NIK *" error={errors.nip?.message} hint="16–18 digit angka"><input {...register("nip")} inputMode="numeric" placeholder="198203042006041001" className={inputCls(!!errors.nip)} /></Field></div>
                <Field label="Jabatan *" error={errors.jabatan?.message} hint="Ketik untuk mencari dari 12 jabatan">
                  <SearchSelect
                    value={watch("jabatan") ?? ""}
                    onChange={(jabatan) => setValue("jabatan", jabatan, { shouldValidate: true, shouldDirty: true })}
                    options={DAFTAR_JABATAN}
                    placeholder="cth: PPK — ketik untuk mencari…"
                    hasError={!!errors.jabatan}
                  />
                </Field>
                <Field label="Nama SKPK / Instansi *" error={errors.skpk?.message} hint="Ketik untuk mencari dari 45 SKPK Simeulue">
                  <SearchSelect
                    value={watch("skpk") ?? ""}
                    onChange={(skpk) => setValue("skpk", skpk, { shouldValidate: true, shouldDirty: true })}
                    options={DAFTAR_SKPK}
                    placeholder="cth: Dinas Pendidikan — ketik untuk mencari…"
                    hasError={!!errors.skpk}
                  />
                </Field>
                <div className="sm:col-span-2"><Field label="Nomor WhatsApp Aktif *" error={errors.wa?.message} hint="Untuk verifikasi & dihubungi petugas bila perlu"><input {...register("wa")} placeholder="081234567890" className={inputCls(!!errors.wa)} /></Field></div>
              </div>
            )}
            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Field label="Jenis Layanan *" error={errors.jenisLayanan?.message} hint={preset ? "🔒 Terkunci dari akses cepat yang dipilih" : undefined}>
                  <select {...register("jenisLayanan")} disabled={!!preset} className={`${inputCls()} ${preset ? "cursor-not-allowed bg-slate-100 text-slate-500" : ""}`}>{getAllLayanan().map((l) => <option key={l} value={l}>{l}</option>)}</select>
                </Field></div>
                <Field label="Tahapan Pengadaan *" error={errors.tahapan?.message}>
                  <select {...register("tahapan")} className={inputCls()}>{TAHAPAN.map((t) => <option key={t} value={t}>{t}</option>)}</select>
                </Field>
                <Field label="Metode Pengadaan *" error={errors.metode?.message}>
                  <select {...register("metode")} className={inputCls()}>{METODE.map((m) => <option key={m} value={m}>{m}</option>)}</select>
                </Field>
                <div className="sm:col-span-2"><Field label="Nama Paket Pengadaan *" error={errors.namaPaket?.message}><input {...register("namaPaket")} placeholder="cth: Pengadaan Laptop Sekolah" className={inputCls(!!errors.namaPaket)} /></Field></div>
                <div className="sm:col-span-2"><Field label="Nilai / HPS / Pagu (opsional)" hint="Otomatis format rupiah saat diketik">
                  <input
                    inputMode="numeric"
                    placeholder="Rp 500.000.000"
                    value={formatNilaiInput(watch("nilai"))}
                    onChange={(e) => setValue("nilai", digitsOnly(e.target.value), { shouldValidate: true, shouldDirty: true })}
                    className={inputCls()}
                  />
                </Field></div>
              </div>
            )}
            {step === 2 && (
              <div className="grid gap-4">
                <Field label="Uraian Permasalahan *" error={errors.uraian?.message}>
                  <textarea {...register("uraian")} rows={5} placeholder="Ceritakan kronologi, kendala, dan pasal/aturan yang membingungkan…" className={inputCls(!!errors.uraian)} />
                  <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${uraianOk ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-500"}`}>
                    {uraianLen}/50 min {uraianOk ? "✓" : ""}
                  </span>
                </Field>
                <Field label="Pertanyaan / Solusi yang Diharapkan *" error={errors.pertanyaan?.message}>
                  <textarea {...register("pertanyaan")} rows={3} placeholder="cth: Apakah klarifikasi via SPSE diperbolehkan? Bagaimana format BA-nya?" className={inputCls(!!errors.pertanyaan)} />
                </Field>
                <Field label="Bentuk Konsultasi yang Diharapkan *">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {BENTUK_KONSULTASI.map((b) => (
                      <label key={b} className={`cursor-pointer rounded-xl px-4 py-3 text-sm font-bold ring-1 transition ${watch("bentuk") === b ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}>
                        <input type="radio" value={b} {...register("bentuk")} className="hidden" />{b === "Konsultasi melalui WhatsApp" ? "💬 Konsultasi melalui WhatsApp" : b === "Konsultasi tatap muka" ? "🤝 Konsultasi tatap muka" : b === "Konsultasi melalui video conference" ? "🎥 Konsultasi melalui video conference" : "✍️ Jawaban/penjelasan tertulis"}
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="Berkas Pendukung (opsional)" error={fileErr} hint="PDF / PNG / JPG • maks 10MB">
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => onFile(e.target.files?.[0])} className="w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white" />
                  <AnimatePresence>
                    {watch("fileName") && preview && (
                      <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                        {preview.kind === "image" ? (
                          <img src={preview.url} alt="Preview berkas" className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-slate-200" />
                        ) : (
                          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-2xl ring-1 ring-rose-200">📄</span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-bold text-slate-800">{watch("fileName")}</span>
                          <span className="text-[11px] text-slate-500">{preview.kind === "pdf" ? "PDF" : "Gambar"} • {preview.size} • pratinjau lokal (hanya nama yang tersimpan)</span>
                        </span>
                        <button type="button" onClick={removeFile} className="shrink-0 cursor-pointer rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-rose-100 hover:text-rose-700">✕ Hapus</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {watch("fileName") && !preview && <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={13} /> {watch("fileName")}</p>}
                </Field>
              </div>
            )}
            {step === 3 && (
              <div>
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><ClipboardCheck size={16} className="text-emerald-600" /> Periksa kembali sebelum dikirim</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200">
                      <p className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">Pemohon</p>
                      <p className="mt-1 font-bold text-slate-800">{v.nama || "-"}</p>
                      <p className="text-xs text-slate-500">{v.jabatan || "-"} • {v.skpk || "-"}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">NIP {v.nip ? maskNip(v.nip) : "-"} • WA {v.wa ? maskWa(v.wa) : "-"}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200">
                      <p className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">Paket</p>
                      <p className="mt-1 font-bold text-slate-800">{v.namaPaket || "-"}</p>
                      <p className="text-xs text-slate-500">{v.jenisLayanan} • {v.tahapan} • {v.metode}</p>
                      <p className="mt-1 text-xs font-bold text-slate-700">{v.nilai && digitsOnly(v.nilai) ? formatRupiah(digitsOnly(v.nilai)) : "Nilai tidak diisi"} • {v.bentuk} {v.fileName ? `• 📎 ${v.fileName}` : ""}</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200">
                    <p className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">Uraian & pertanyaan</p>
                    <p className="clamp-2 mt-1 text-slate-700">{v.uraian || "-"}</p>
                    <p className="mt-2 text-slate-700"><b>Q:</b> {v.pertanyaan || "-"}</p>
                  </div>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-900">
                    <input type="checkbox" {...register("setuju")} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-emerald-600" />
                    <span>Saya memahami tanggapan Tim KLIK-PBJ bersifat konsultatif dan tidak mengambil alih kewenangan pejabat berwenang. Keputusan akhir menjadi tanggung jawab pejabat yang berwenang.</span>
                  </label>
                  {errors.setuju && <p className="text-xs font-semibold text-rose-600">{errors.setuju.message}</p>}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-7 flex items-center justify-between gap-3">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowLeft size={16} /> Kembali</button>
          {step < 3 ? (
            <Button onClick={next}>Lanjut <ArrowRight size={16} /></Button>
          ) : (
            <Button onClick={handleSubmit(submit)}><Send size={15} /> Kirim Konsultasi</Button>
          )}
        </div>
        {!isValid && step === 3 && <p className="mt-2 text-right text-[11px] text-slate-400">Centang persetujuan untuk mengaktifkan pengiriman</p>}
      </Card>
    </main>
  );
}
