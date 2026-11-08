"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Settings2, Tag, Languages, Hash,
  AlertCircle, Check, Loader2, Pencil, X, ChevronDown, Sparkles,
} from "lucide-react";
import { saveDoctorTreatmentTypes } from "@/app/actions/doctorPortal";
import type { TreatmentTypeOption } from "@/lib/treatmentTypes";

/** Wrap fetch with a manual timeout using Promise.race */
function fetchWithTimeout(url: string, ms = 6000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

/**
 * Translate Arabic → English.
 * Primary:  MyMemory  (free, CORS-enabled, no key needed)
 * Fallback: Google Translate unofficial endpoint
 */
async function autoTranslate(text: string): Promise<string> {
  // ── Primary: MyMemory ──────────────────────────────────────────────────
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|en`;
    const res = await fetchWithTimeout(url);
    if (res.ok) {
      const data = await res.json();
      const t: string = data?.responseData?.translatedText ?? "";
      if (t && !t.startsWith("PLEASE SELECT")) return t.trim();
    }
  } catch { /* fall through */ }

  // ── Fallback: Google Translate ─────────────────────────────────────────
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetchWithTimeout(url);
    if (res.ok) {
      const data = await res.json();
      const t: string = (data[0] as [string, ...unknown[]][] | null)
        ?.map(c => c[0]).join("") ?? "";
      if (t) return t.trim();
    }
  } catch { /* ignore */ }

  return "";
}

export default function TreatmentTypesManager({
  doctorId,
  locale,
  initialTypes,
}: {
  doctorId: string;
  locale: string;
  initialTypes: TreatmentTypeOption[];
}) {
  const ar = locale === "ar";
  const router = useRouter();

  const [expanded, setExpanded] = useState(false);
  const [types, setTypes] = useState(initialTypes);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [labelAr, setLabelAr] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [translating, setTranslating] = useState(false);
  const enManuallyEdited = useRef(false);   // true = user typed manually → don't overwrite

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAr, setEditAr] = useState("");
  const [editEn, setEditEn] = useState("");
  const [editTranslating, setEditTranslating] = useState(false);
  const editEnManual = useRef(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Auto-translate: Add form ─────────────────────────────────────────────
  useEffect(() => {
    if (enManuallyEdited.current) return;
    const trimmed = labelAr.trim();
    if (!trimmed) { setLabelEn(""); return; }
    const id = setTimeout(async () => {
      setTranslating(true);
      try {
        const result = await autoTranslate(trimmed);
        if (!enManuallyEdited.current && result) setLabelEn(result);
      } finally {
        setTranslating(false);
      }
    }, 600);
    return () => clearTimeout(id);
  }, [labelAr]);

  // ── Auto-translate: Edit form ────────────────────────────────────────────
  useEffect(() => {
    if (editEnManual.current) return;
    const trimmed = editAr.trim();
    if (!trimmed) { setEditEn(""); return; }
    const id = setTimeout(async () => {
      setEditTranslating(true);
      try {
        const result = await autoTranslate(trimmed);
        if (!editEnManual.current && result) setEditEn(result);
      } finally {
        setEditTranslating(false);
      }
    }, 600);
    return () => clearTimeout(id);
  }, [editAr]);

  async function persist(next: TreatmentTypeOption[], flashId?: string) {
    setSaving(true);
    await saveDoctorTreatmentTypes(doctorId, next);
    setTypes(next);
    setSaving(false);
    if (flashId) {
      setSavedId(flashId);
      setTimeout(() => setSavedId(null), 2000);
    }
    router.refresh();
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!labelAr.trim()) return;
    const value = `custom_${Date.now()}`;
    persist([...types, { value, labelAr: labelAr.trim(), labelEn: labelEn.trim() || labelAr.trim() }], value);
    setLabelAr(""); setLabelEn("");
    enManuallyEdited.current = false;
    setShowAdd(false);
  }

  function startEdit(t: TreatmentTypeOption) {
    editEnManual.current = false;
    setEditingId(t.value); setEditAr(t.labelAr); setEditEn(t.labelEn);
  }

  function handleEditSave(value: string) {
    if (!editAr.trim()) return;
    const next = types.map(t => t.value === value
      ? { ...t, labelAr: editAr.trim(), labelEn: editEn.trim() || editAr.trim() }
      : t);
    persist(next, value);
    setEditingId(null);
  }

  function handleRemove(value: string) {
    persist(types.filter(t => t.value !== value));
    setDeleteId(null);
  }

  function openAdd() {
    setExpanded(true);
    setShowAdd(true);
  }

  return (
    <div className="rounded-2xl overflow-hidden mb-6" style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>

      {/* ════ Header — always visible, clickable ════ */}
      <div className="flex items-center gap-3 px-6 py-4 cursor-pointer select-none transition-colors hover:bg-white/2"
        style={{ borderBottom: expanded ? "1px solid var(--border)" : undefined }}
        onClick={() => setExpanded(v => !v)}>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/20 shrink-0">
          <Settings2 size={16} className="text-indigo-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
            {ar ? "أنواع العلاج" : "Treatment Types"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            {types.length === 0
              ? (ar ? "لا توجد أنواع — اضغط للإضافة" : "No types yet — click to add")
              : (ar ? `${types.length} نوع مضاف` : `${types.length} types added`)}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Add button — stops propagation so it doesn't toggle collapse */}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); openAdd(); }}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            <Plus size={12} />
            {ar ? "إضافة" : "Add"}
          </button>

          <ChevronDown size={16}
            className="transition-transform duration-200 shrink-0"
            style={{ color: "var(--text-3)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }} />
        </div>
      </div>

      {/* ════ Collapsible body ════ */}
      {expanded && (
        <>
          {/* ── Inline Add Row ── */}
          {showAdd && (
            <form onSubmit={handleAdd}>
              <div className="px-6 py-4 flex flex-wrap gap-3 items-end"
                style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
                <div className="flex-1 min-w-[140px] space-y-1.5">
                  <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--text-2)" }}>
                    <Tag size={11} className="text-indigo-400" />
                    {ar ? "الاسم بالعربية" : "Arabic name"}
                    <span className="text-rose-400">*</span>
                  </label>
                  <input value={labelAr}
                    onChange={e => { setLabelAr(e.target.value); enManuallyEdited.current = false; }}
                    placeholder={ar ? "مثال: تقويم الأسنان" : "e.g. تقويم الأسنان"}
                    required dir="rtl" autoFocus className="form-input text-sm w-full" />
                </div>
                <div className="flex-1 min-w-[140px] space-y-1.5">
                  <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--text-2)" }}>
                    <Languages size={11} className="text-indigo-400" />
                    {ar ? "الترجمة الإنجليزية" : "English translation"}
                    {translating
                      ? <span className="flex items-center gap-1 text-indigo-400 ms-1"><Loader2 size={10} className="animate-spin" />{ar ? "جاري الترجمة..." : "Translating..."}</span>
                      : labelEn && !enManuallyEdited.current && <span className="flex items-center gap-1 text-emerald-400 ms-1"><Sparkles size={10} />{ar ? "تُرجم تلقائياً" : "Auto-translated"}</span>
                    }
                  </label>
                  <input value={labelEn}
                    onChange={e => { enManuallyEdited.current = true; setLabelEn(e.target.value); }}
                    placeholder={ar ? "تترجم تلقائياً..." : "Auto-translates..."}
                    dir="ltr" className="form-input text-sm w-full" />
                </div>
                <div className="flex items-center gap-2">
                  <button type="submit" disabled={saving || !labelAr.trim()}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition disabled:opacity-40"
                    style={{ background: "var(--indigo)" }}>
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    {saving ? (ar ? "جاري..." : "Saving...") : (ar ? "حفظ" : "Save")}
                  </button>
                  <button type="button"
                    onClick={() => { setShowAdd(false); setLabelAr(""); setLabelEn(""); }}
                    className="flex items-center justify-center h-9 w-9 rounded-xl transition hover:opacity-80"
                    style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}>
                    <X size={13} />
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ── Empty state ── */}
          {types.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/8 border border-indigo-500/15">
                <Tag size={22} className="text-indigo-400/40" />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
                {ar ? "لا توجد أنواع علاج بعد" : "No treatment types yet"}
              </p>
              <button type="button" onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white mt-1 transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                <Plus size={12} />
                {ar ? "إضافة أول نوع" : "Add first type"}
              </button>
            </div>

          ) : (
            /* ── Table ── */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
                    <th className="px-5 py-3 text-start w-12">
                      <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                        <Hash size={10} />#
                      </span>
                    </th>
                    <th className="px-5 py-3 text-start">
                      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                        <Tag size={10} />{ar ? "الاسم بالعربية" : "Arabic Name"}
                      </span>
                    </th>
                    <th className="px-5 py-3 text-start">
                      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                        <Languages size={10} />{ar ? "الاسم بالإنجليزية" : "English Name"}
                      </span>
                    </th>
                    <th className="px-5 py-3 text-end w-44">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                        {ar ? "إجراءات" : "Actions"}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((t, idx) => (
                    <tr key={t.value}
                      style={{ borderBottom: idx < types.length - 1 ? "1px solid var(--border)" : undefined }}
                      className="group transition-colors hover:bg-white/2">

                      {editingId === t.value ? (
                        /* edit row */
                        <>
                          <td className="px-5 py-3">
                            <span className="text-xs font-mono" style={{ color: "var(--text-3)" }}>{idx + 1}</span>
                          </td>
                          <td className="px-5 py-3">
                            <input value={editAr}
                              onChange={e => { editEnManual.current = false; setEditAr(e.target.value); }}
                              dir="rtl" autoFocus className="form-input text-sm w-full" />
                          </td>
                          <td className="px-5 py-3">
                            <div className="relative">
                              <input value={editEn}
                                onChange={e => { editEnManual.current = true; setEditEn(e.target.value); }}
                                dir="ltr" className="form-input text-sm w-full" />
                              {editTranslating && (
                                <span className="absolute end-2.5 top-1/2 -translate-y-1/2">
                                  <Loader2 size={12} className="animate-spin text-indigo-400" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button type="button" onClick={() => handleEditSave(t.value)}
                                disabled={saving || !editAr.trim()}
                                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-40"
                                style={{ background: "var(--indigo)" }}>
                                {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                {ar ? "حفظ" : "Save"}
                              </button>
                              <button type="button" onClick={() => setEditingId(null)}
                                className="rounded-lg px-3 py-1.5 text-xs transition hover:opacity-80"
                                style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}>
                                {ar ? "إلغاء" : "Cancel"}
                              </button>
                            </div>
                          </td>
                        </>

                      ) : deleteId === t.value ? (
                        /* delete confirm row */
                        <>
                          <td colSpan={3} className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <AlertCircle size={14} className="text-rose-400 shrink-0" />
                              <span className="text-xs font-medium" style={{ color: "var(--text-1)" }}>
                                {ar ? `هل تريد حذف "${t.labelAr}"؟` : `Delete "${t.labelEn}"?`}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button type="button" onClick={() => handleRemove(t.value)}
                                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition"
                                style={{ background: "#e11d48" }}>
                                <Trash2 size={11} />
                                {ar ? "تأكيد الحذف" : "Confirm"}
                              </button>
                              <button type="button" onClick={() => setDeleteId(null)}
                                className="rounded-lg px-3 py-1.5 text-xs transition hover:opacity-80"
                                style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}>
                                {ar ? "إلغاء" : "Cancel"}
                              </button>
                            </div>
                          </td>
                        </>

                      ) : (
                        /* normal row */
                        <>
                          <td className="px-5 py-3.5">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold"
                              style={{ background: "var(--bg-surface)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              {savedId === t.value && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
                                  <Check size={10} className="text-emerald-400" />
                                </span>
                              )}
                              <span className="font-medium" style={{ color: "var(--text-1)" }} dir="rtl">
                                {t.labelAr}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span style={{ color: "var(--text-2)" }} dir="ltr">{t.labelEn}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={() => startEdit(t)}
                                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition hover:opacity-80"
                                style={{ border: "1px solid var(--border)", color: "var(--text-2)", background: "var(--bg-surface)" }}>
                                <Pencil size={11} />{ar ? "تعديل" : "Edit"}
                              </button>
                              <button type="button" onClick={() => setDeleteId(t.value)}
                                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition text-rose-400 hover:bg-rose-500/10">
                                <Trash2 size={11} />{ar ? "حذف" : "Delete"}
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="px-6 py-3 flex items-center justify-between"
            style={{ borderTop: "1px solid var(--border)", background: "var(--bg-surface)" }}>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>
              {ar
                ? "تظهر هذه الأنواع عند إنشاء خطة علاج للمرضى الدائمين"
                : "These types appear when creating a treatment plan for recurring patients"}
            </p>
            {saving && (
              <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
                <Loader2 size={11} className="animate-spin" />
                {ar ? "جاري الحفظ..." : "Saving..."}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
