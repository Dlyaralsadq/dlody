"use client";

import { useEffect, useState } from "react";
import { FileText, ImageIcon, Loader2, Plus, Stethoscope } from "lucide-react";
import {
  addClinicalNote,
  addPatientDiagnosis,
  getPatientChart,
  setDiagnosisStatus,
} from "@/app/actions/patientChart";

type Chart = NonNullable<Awaited<ReturnType<typeof getPatientChart>>>;

export default function PatientChartPanel({
  doctorId,
  patientId,
  locale,
}: {
  doctorId: string;
  patientId: string;
  locale: string;
}) {
  const ar = locale === "ar";
  const [chart, setChart] = useState<Chart | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("lab");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function reload() {
    const data = await getPatientChart(doctorId, patientId);
    setChart(data);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, patientId]);

  async function saveNote() {
    setBusy(true);
    setError("");
    const result = await addClinicalNote(doctorId, patientId, note);
    setBusy(false);
    if (!result.success) {
      setError(ar ? "تعذر حفظ الملاحظة" : "Could not save the note");
      return;
    }
    setNote("");
    await reload();
  }

  async function saveDiagnosis() {
    setBusy(true);
    setError("");
    const result = await addPatientDiagnosis(doctorId, patientId, diagnosis);
    setBusy(false);
    if (!result.success) {
      setError(ar ? "تعذر حفظ التشخيص" : "Could not save the diagnosis");
      return;
    }
    setDiagnosis("");
    await reload();
  }

  async function upload(file: File) {
    setBusy(true);
    setError("");
    const body = new FormData();
    body.set("doctorId", doctorId);
    body.set("patientId", patientId);
    body.set("category", category);
    body.set("title", title);
    body.set("file", file);
    const res = await fetch("/api/patient-files", { method: "POST", body });
    setBusy(false);
    if (!res.ok) {
      setError(ar ? "يُقبل الصور وملفات PDF حتى 8 ميغابايت" : "Images and PDF files up to 8 MB are accepted");
      return;
    }
    setTitle("");
    await reload();
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
        <Loader2 className="h-4 w-4 animate-spin" />
        {ar ? "جاري فتح الملف الطبي..." : "Opening the medical file..."}
      </div>
    );
  }

  if (!chart) return null;

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
        {ar ? "الملف الطبي" : "Medical chart"}
      </p>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      <section className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-2">
        <p className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
          <Stethoscope className="h-3.5 w-3.5" />
          {ar ? "التشخيصات" : "Diagnoses"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {chart.diagnoses.length === 0 && (
            <p className="text-xs text-slate-500">{ar ? "لا تشخيصات مسجّلة بعد" : "No diagnoses yet"}</p>
          )}
          {chart.diagnoses.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void setDiagnosisStatus(doctorId, item.id, item.status === "active" ? "resolved" : "active").then(reload)}
              className={`rounded-full px-2.5 py-1 text-xs border ${
                item.status === "active"
                  ? "border-indigo-400/40 text-indigo-200 bg-indigo-500/15"
                  : "border-white/10 text-slate-500 line-through"
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder={ar ? "تشخيص جديد" : "New diagnosis"}
            className="form-input flex-1 text-sm"
          />
          <button type="button" disabled={busy || diagnosis.trim().length < 2} onClick={() => void saveDiagnosis()} className="rounded-xl bg-indigo-600 px-3 text-xs text-white disabled:opacity-40">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-2">
        <p className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          {ar ? "الملاحظات السريرية" : "Clinical notes"}
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder={ar ? "ملاحظة الزيارة أو الخطة العلاجية" : "Visit note or care plan"}
          className="form-input resize-none text-sm"
        />
        <button type="button" disabled={busy || note.trim().length < 2} onClick={() => void saveNote()} className="rounded-xl bg-white/10 px-3 py-1.5 text-xs text-white disabled:opacity-40">
          {ar ? "حفظ الملاحظة" : "Save note"}
        </button>
        <div className="space-y-2">
          {chart.notes.map((item) => (
            <div key={item.id} className="rounded-lg bg-black/20 px-3 py-2">
              <p className="text-xs text-slate-200 leading-relaxed">{item.body}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                {new Date(item.createdAt).toLocaleString(ar ? "ar-IQ" : "en-GB")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-2">
        <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5" />
          {ar ? "الصور والتحاليل وملفات PDF" : "Images, labs, and PDFs"}
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={ar ? "اسم الملف" : "File title"}
            className="form-input flex-1 min-w-32 text-sm"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-input w-auto text-sm">
            <option value="lab">{ar ? "تحليل" : "Lab"}</option>
            <option value="image">{ar ? "صورة" : "Image"}</option>
            <option value="pdf">PDF</option>
          </select>
          <label className="rounded-xl bg-emerald-600 px-3 py-2 text-xs text-white cursor-pointer">
            {busy ? "..." : ar ? "رفع" : "Upload"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {chart.documents.map((doc) => (
            <a
              key={doc.id}
              href={`/api/patient-files/${doc.id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/8 px-2 py-2 text-xs text-slate-200 hover:bg-white/5"
            >
              <p className="font-semibold truncate">{doc.title}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{doc.category.toUpperCase()}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
