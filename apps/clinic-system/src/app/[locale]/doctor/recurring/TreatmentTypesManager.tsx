"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Settings2 } from "lucide-react";
import { saveDoctorTreatmentTypes } from "@/app/actions/doctorPortal";
import type { TreatmentTypeOption } from "@/lib/treatmentTypes";

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
  const [types, setTypes] = useState(initialTypes);
  const [labelAr, setLabelAr] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function persist(next: TreatmentTypeOption[]) {
    setSaving(true);
    await saveDoctorTreatmentTypes(doctorId, next);
    setTypes(next);
    setSaving(false);
    router.refresh();
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!labelAr.trim()) return;
    const value = `custom_${Date.now()}`;
    persist([...types, { value, labelAr: labelAr.trim(), labelEn: labelEn.trim() || labelAr.trim() }]);
    setLabelAr("");
    setLabelEn("");
    setOpen(false);
  }

  function handleRemove(value: string) {
    persist(types.filter((t) => t.value !== value));
  }

  return (
    <div className="card-premium p-4 mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Settings2 size={15} className="text-indigo-400" />
          {ar ? "أنواع العلاج" : "Treatment types"}
        </h2>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
        >
          <Plus size={13} />
          {ar ? "إضافة نوع" : "Add type"}
        </button>
      </div>

      <p className="text-[11px] text-white/30">
        {ar ? "تظهر هذه الأنواع في قائمة اختيار العلاج لجميع المرضى الدائمين" : "Shown in the treatment dropdown for all recurring patients"}
      </p>

      <div className="flex flex-wrap gap-2">
        {types.map((t) => (
          <span key={t.value} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            {ar ? t.labelAr : t.labelEn}
            <button type="button" onClick={() => handleRemove(t.value)} className="text-rose-400 hover:text-rose-300">
              <Trash2 size={11} />
            </button>
          </span>
        ))}
      </div>

      {open && (
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-2 pt-2 border-t border-white/8">
          <input
            value={labelAr}
            onChange={(e) => setLabelAr(e.target.value)}
            placeholder={ar ? "اسم العلاج (عربي)" : "Name (Arabic)"}
            required
            dir="rtl"
            className="form-input text-sm"
          />
          <input
            value={labelEn}
            onChange={(e) => setLabelEn(e.target.value)}
            placeholder={ar ? "اسم (إنجليزي)" : "Name (English)"}
            dir="ltr"
            className="form-input text-sm"
          />
          <button type="submit" disabled={saving} className="col-span-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 py-2 text-xs font-semibold text-indigo-300">
            {ar ? "إضافة" : "Add"}
          </button>
        </form>
      )}
    </div>
  );
}
