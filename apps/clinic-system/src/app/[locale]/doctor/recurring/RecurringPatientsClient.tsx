"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CalendarPlus, CheckCircle2, AlertCircle, Clock, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";

interface RecurringPatient {
  id: string; patientNumber: string; name: string; phone: string;
  treatmentType: string | null; totalSessions: number | null;
  sessionsCompleted: number | null; nextVisitDate: string | null;
  recurringWeeks: number | null; _count: { appointments: number };
}

const TREATMENT_TYPES = [
  { value: "orthodontics", labelAr: "تقويم الأسنان", labelEn: "Orthodontics" },
  { value: "implant", labelAr: "زراعة الأسنان", labelEn: "Dental Implant" },
  { value: "root_canal", labelAr: "علاج العصب", labelEn: "Root Canal" },
  { value: "whitening", labelAr: "تبييض الأسنان", labelEn: "Teeth Whitening" },
  { value: "crown", labelAr: "تركيب التاج", labelEn: "Crown Fitting" },
  { value: "cleaning", labelAr: "تنظيف دوري", labelEn: "Periodic Cleaning" },
  { value: "surgery", labelAr: "جراحة أسنان", labelEn: "Dental Surgery" },
  { value: "other", labelAr: "علاج آخر", labelEn: "Other" },
];

async function updateRecurringPatient(patientId: string, data: {
  sessionsCompleted?: number; nextVisitDate?: string; treatmentType?: string;
  totalSessions?: number; recurringWeeks?: number;
}) {
  const res = await fetch(`/api/patients/${patientId}/recurring`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.ok;
}

export default function RecurringPatientsClient({ patients, doctorId, locale, today, treatmentTypes }: {
  patients: RecurringPatient[]; doctorId: string; locale: string; today: string;
  treatmentTypes?: { value: string; labelAr: string; labelEn: string }[];
}) {
  const router = useRouter();
  const ar = locale === "ar";
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<RecurringPatient | null>(null);
  const [loading, setLoading] = useState(false);

  const todayDate = new Date(today);

  const overdue = patients.filter(p => p.nextVisitDate && new Date(p.nextVisitDate) < todayDate);
  const upcoming = patients.filter(p => {
    if (!p.nextVisitDate) return false;
    const d = new Date(p.nextVisitDate);
    const diff = (d.getTime() - todayDate.getTime()) / (1000 * 3600 * 24);
    return diff >= 0 && diff <= 14;
  });
  const other = patients.filter(p => !overdue.includes(p) && !upcoming.includes(p));

  const allTypes = treatmentTypes ?? TREATMENT_TYPES;
  const treatmentLabel = (type: string | null) => {
    if (!type) return "—";
    const t = allTypes.find(x => x.value === type);
    return ar ? (t?.labelAr ?? type) : (t?.labelEn ?? type);
  };

  const statusOf = (p: RecurringPatient) => {
    if (!p.nextVisitDate) return { color: "text-slate-500", icon: null, label: ar ? "غير محدد" : "Not set" };
    const d = new Date(p.nextVisitDate);
    const diff = (d.getTime() - todayDate.getTime()) / (1000 * 3600 * 24);
    if (diff < 0) return { color: "text-rose-400", icon: <AlertCircle className="h-3.5 w-3.5" />, label: ar ? "تأخر" : "Overdue" };
    if (diff === 0) return { color: "text-amber-400", icon: <Clock className="h-3.5 w-3.5" />, label: ar ? "اليوم" : "Today" };
    if (diff <= 7) return { color: "text-amber-400", icon: <Clock className="h-3.5 w-3.5" />, label: ar ? `خلال ${Math.ceil(diff)} أيام` : `In ${Math.ceil(diff)} days` };
    return { color: "text-emerald-400", icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: formatDate(d, locale) };
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await fetch("/api/patients/recurring", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: selected.id,
        treatmentType: fd.get("treatmentType"),
        totalSessions: fd.get("totalSessions") ? parseInt(fd.get("totalSessions") as string) : undefined,
        sessionsCompleted: fd.get("sessionsCompleted") ? parseInt(fd.get("sessionsCompleted") as string) : undefined,
        recurringWeeks: fd.get("recurringWeeks") ? parseInt(fd.get("recurringWeeks") as string) : undefined,
        nextVisitDate: fd.get("nextVisitDate") || undefined,
      }),
    });
    setLoading(false);
    setEditOpen(false);
    router.refresh();
  };

  const PatientCard = ({ p }: { p: RecurringPatient }) => {
    const status = statusOf(p);
    const progress = p.totalSessions && p.sessionsCompleted != null
      ? Math.round((p.sessionsCompleted / p.totalSessions) * 100)
      : null;

    return (
      <div className="card-premium p-4 hover:border-white/12 transition-colors">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 font-bold">
              {p.name[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{p.name}</p>
              <p className="text-xs text-slate-500">{p.phone}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-white shrink-0"
            onClick={() => { setSelected(p); setEditOpen(true); }}>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </Button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{ar ? "خطة العلاج" : "Treatment"}</span>
            <span className="text-white/70 font-medium">{treatmentLabel(p.treatmentType)}</span>
          </div>

          {p.totalSessions && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-500">{ar ? "الجلسات" : "Sessions"}</span>
                <span className={`font-semibold ${(p.sessionsCompleted ?? 0) >= (p.totalSessions ?? 0) ? "text-emerald-400" : "text-white"}`}>
                  {p.sessionsCompleted ?? 0}/{p.totalSessions}
                </span>
              </div>
              {progress !== null && (
                <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-slate-500">{ar ? "الزيارة القادمة" : "Next Visit"}</span>
            <span className={`flex items-center gap-1 font-medium ${status.color}`}>
              {status.icon}{status.label}
            </span>
          </div>

          {p.recurringWeeks && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{ar ? "كل" : "Every"}</span>
              <span className="text-white/50">{p.recurringWeeks} {ar ? "أسبوع" : "weeks"}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const treatmentOpts = (treatmentTypes ?? TREATMENT_TYPES).map(t => ({ value: t.value, label: ar ? t.labelAr : t.labelEn }));
  const weekOpts = [1,2,3,4,5,6,8,10,12].map(w => ({ value: String(w), label: `${w} ${ar ? "أسبوع" : "weeks"}` }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-indigo-400" />
          {ar ? "المرضى الدائمون والعلاجات المتكررة" : "Recurring Patients & Treatments"}
        </h1>
        <p className="text-sm text-white/30 mt-1">
          {ar ? `${patients.length} مريض دائم` : `${patients.length} recurring patients`}
          {overdue.length > 0 && <span className="text-rose-400 ms-2">· {overdue.length} {ar ? "متأخر" : "overdue"}</span>}
        </p>
      </div>

      {patients.length === 0 ? (
        <div className="card-premium p-14 text-center">
          <RefreshCw className="h-10 w-10 mx-auto mb-3 text-slate-700" />
          <p className="text-white/30 text-sm">{ar ? "لا يوجد مرضى دائمون بعد" : "No recurring patients yet"}</p>
          <p className="text-white/20 text-xs mt-1">{ar ? "أضف مريضاً وفعّل خيار المريض الدائم في بيانات المريض" : "Add a patient and enable recurring in patient details"}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                <AlertCircle className="h-3.5 w-3.5" />{ar ? "تأخروا في المراجعة" : "Overdue"}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {overdue.map(p => <PatientCard key={p.id} p={p} />)}
              </div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5" />{ar ? "مواعيد خلال أسبوعين" : "Upcoming (2 weeks)"}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map(p => <PatientCard key={p.id} p={p} />)}
              </div>
            </div>
          )}
          {other.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{ar ? "باقي المرضى" : "Others"}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {other.map(p => <PatientCard key={p.id} p={p} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)}
        title={ar ? "تحديث خطة العلاج" : "Update Treatment Plan"} size="md"
        footer={<>
          <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={loading}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="recurring-form" loading={loading}>{ar ? "حفظ" : "Save"}</Button>
        </>}>
        {selected && (
          <form id="recurring-form" onSubmit={handleSave} className="space-y-4">
            <div className="rounded-xl bg-indigo-500/8 border border-indigo-500/15 p-3 text-sm">
              <span className="text-indigo-300 font-semibold">{selected.name}</span>
              <span className="text-white/30 mx-2">·</span>
              <span className="text-white/40">{selected.phone}</span>
            </div>
            <Select name="treatmentType" label={ar ? "نوع العلاج" : "Treatment Type"}
              options={treatmentOpts} defaultValue={selected.treatmentType ?? ""}
              placeholder={ar ? "اختر نوع العلاج" : "Select treatment"} />
            <div className="grid grid-cols-2 gap-3">
              <Input name="totalSessions" type="number" min="1" label={ar ? "عدد الجلسات الإجمالي" : "Total Sessions"}
                defaultValue={selected.totalSessions?.toString() ?? ""} />
              <Input name="sessionsCompleted" type="number" min="0" label={ar ? "الجلسات المنجزة" : "Completed"}
                defaultValue={selected.sessionsCompleted?.toString() ?? "0"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select name="recurringWeeks" label={ar ? "كل كم أسبوع؟" : "Every (weeks)"}
                options={weekOpts} defaultValue={selected.recurringWeeks?.toString() ?? ""}
                placeholder={ar ? "اختر" : "Select"} />
              <Input name="nextVisitDate" type="date" label={ar ? "الزيارة القادمة" : "Next Visit"}
                defaultValue={selected.nextVisitDate ? new Date(selected.nextVisitDate).toISOString().split("T")[0] : ""} />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
