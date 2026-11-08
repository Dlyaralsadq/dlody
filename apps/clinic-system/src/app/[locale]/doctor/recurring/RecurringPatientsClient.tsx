"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, CheckCircle2, AlertCircle, Clock, RefreshCw, Eye, Pill, FileText, Calendar, Stethoscope, Loader2, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { formatDate, formatTime, calculateAge } from "@/lib/utils";
import { getPatientHistoryForDoctor } from "@/app/actions/clinic";
import PatientChartPanel from "@/components/clinic/PatientChartPanel";
import { updateRecurringPatientData } from "@/app/actions/doctorPortal";

interface RecurringPatient {
  id: string; patientNumber: string; name: string; phone: string;
  nationalId: string | null;
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

export default function RecurringPatientsClient({ patients, doctorId, locale, today, treatmentTypes }: {
  patients: RecurringPatient[]; doctorId: string; locale: string; today: string;
  treatmentTypes?: { value: string; labelAr: string; labelEn: string }[];
}) {
  const router = useRouter();
  const ar = locale === "ar";
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<RecurringPatient | null>(null);
  const [loading, setLoading] = useState(false);

  // History modal
  type PatientHistory = Awaited<ReturnType<typeof getPatientHistoryForDoctor>>;
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [patientHistory, setPatientHistory] = useState<PatientHistory>(null);

  const openHistory = async (patientId: string) => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setPatientHistory(null);
    try {
      const data = await getPatientHistoryForDoctor(doctorId, patientId);
      setPatientHistory(data);
    } finally {
      setHistoryLoading(false);
    }
  };

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

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setSaveError(null);
    const fd = new FormData(e.currentTarget);

    const treatmentTypeRaw = fd.get("treatmentType") as string | null;
    const totalSessionsRaw  = fd.get("totalSessions") as string | null;
    const sessionsRaw       = fd.get("sessionsCompleted") as string | null;
    const weeksRaw          = fd.get("recurringWeeks") as string | null;
    const nextVisitRaw      = fd.get("nextVisitDate") as string | null;

    const result = await updateRecurringPatientData(selected.id, doctorId, {
      treatmentType:     treatmentTypeRaw || null,
      totalSessions:     totalSessionsRaw  ? parseInt(totalSessionsRaw,  10) : null,
      sessionsCompleted: sessionsRaw !== null && sessionsRaw !== "" ? parseInt(sessionsRaw, 10) : null,
      recurringWeeks:    weeksRaw    ? parseInt(weeksRaw,   10) : null,
      nextVisitDate:     nextVisitRaw || null,
    });

    setLoading(false);
    if (result.success) {
      setEditOpen(false);
      router.refresh();
    } else {
      setSaveError(ar ? "حدث خطأ أثناء الحفظ، حاول مرة أخرى" : "Failed to save, please try again");
    }
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
            <div className="patient-avatar patient-avatar-md">{p.name[0]}</div>
            <div>
              <p className="text-sm font-semibold text-white">{p.name}</p>
              <p className="text-xs text-slate-500">{p.phone}</p>
              {p.nationalId && (
                <p className="text-xs font-mono font-semibold text-amber-400/80 flex items-center gap-1 mt-0.5">
                  🪪 {p.nationalId}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-indigo-400/70 hover:text-indigo-300"
              title={ar ? "ملف المريض" : "Patient File"}
              onClick={() => openHistory(p.id)}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-white"
              onClick={() => { setSelected(p); setEditOpen(true); }}>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </Button>
          </div>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-indigo-400" />
            {ar ? "المرضى الدائمون والعلاجات المتكررة" : "Recurring Patients & Treatments"}
          </h1>
          <p className="text-sm text-white/30 mt-1">
            {ar ? "إدارة خطط العلاج المتكررة" : "Manage recurring treatment plans"}
          </p>
        </div>
        {patients.length > 0 && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {([
              { n: patients.length, label: ar ? "إجمالي" : "Total",    gradient: "linear-gradient(135deg,#6366f1,#8b5cf6)", glow: "rgba(99,102,241,.3)"  },
              { n: upcoming.length, label: ar ? "قادم"   : "Upcoming", gradient: "linear-gradient(135deg,#f59e0b,#d97706)", glow: "rgba(245,158,11,.3)"  },
              { n: overdue.length,  label: ar ? "متأخر"  : "Overdue",  gradient: "linear-gradient(135deg,#ef4444,#dc2626)", glow: "rgba(239,68,68,.3)"   },
            ] as const).map(({ n, label, gradient, glow }) => (
              <div key={label}
                className="relative overflow-hidden flex items-center gap-2 rounded-xl px-3.5 py-2"
                style={{ background: gradient, boxShadow: `0 4px 16px ${glow}` }}>
                <span className="text-lg font-black text-white leading-none">{n}</span>
                <span className="text-xs text-white/75 font-medium">{label}</span>
              </div>
            ))}
          </div>
        )}
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

      {/* ── Patient History Modal ── */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setHistoryOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/8 bg-[#0f1629] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-indigo-400" />
                <h2 className="text-base font-semibold text-white">
                  {ar ? "ملف المريض الطبي" : "Patient Medical File"}
                </h2>
              </div>
              <button onClick={() => setHistoryOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {historyLoading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">{ar ? "جاري التحميل..." : "Loading..."}</span>
                </div>
              ) : !patientHistory ? (
                <div className="text-center py-12 text-slate-600 text-sm">{ar ? "لا توجد بيانات" : "No data found"}</div>
              ) : (
                <>
                  {/* Patient summary */}
                  <div className="rounded-xl bg-indigo-500/8 border border-indigo-500/15 p-4 flex flex-wrap gap-4 items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 font-bold text-lg">
                      {patientHistory.patient.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{patientHistory.patient.name}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                        <span>{patientHistory.patient.phone}</span>
                        {patientHistory.patient.nationalId && <span className="font-mono">{patientHistory.patient.nationalId}</span>}
                        {patientHistory.patient.dateOfBirth && <span>{calculateAge(patientHistory.patient.dateOfBirth)} {ar ? "سنة" : "y"}</span>}
                        {patientHistory.patient.bloodType && <span className="text-red-400 font-semibold">{patientHistory.patient.bloodType}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 text-center">
                      <p className="text-2xl font-bold text-indigo-400">{patientHistory.appointments.length}</p>
                      <p className="text-xs text-slate-500">{ar ? "زيارة مكتملة" : "visits"}</p>
                    </div>
                  </div>

                  {/* Medical background */}
                  {(patientHistory.patient.medicalHistory || patientHistory.patient.allergies) && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {patientHistory.patient.medicalHistory && (
                        <div className="rounded-xl bg-amber-500/8 border border-amber-500/15 p-3">
                          <p className="text-xs font-semibold text-amber-400 mb-1.5">{ar ? "التاريخ المرضي" : "Medical History"}</p>
                          <p className="text-xs text-slate-400 leading-relaxed">{patientHistory.patient.medicalHistory}</p>
                        </div>
                      )}
                      {patientHistory.patient.allergies && (
                        <div className="rounded-xl bg-rose-500/8 border border-rose-500/15 p-3">
                          <p className="text-xs font-semibold text-rose-400 mb-1.5">{ar ? "الحساسية" : "Allergies"}</p>
                          <p className="text-xs text-slate-400 leading-relaxed">{patientHistory.patient.allergies}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <PatientChartPanel doctorId={doctorId} patientId={patientHistory.patient.id} locale={locale} />

                  {/* Visits */}
                  {patientHistory.appointments.length === 0 ? (
                    <div className="text-center py-8 text-slate-600 text-sm">{ar ? "لا توجد زيارات مكتملة بعد" : "No completed visits yet"}</div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{ar ? "سجل الزيارات" : "Visit History"}</p>
                      {patientHistory.appointments.map((apt, idx) => (
                        <div key={apt.id} className="rounded-xl border border-white/6 bg-white/3 p-4 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                                {patientHistory.appointments.length - idx}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Calendar className="h-3 w-3" />
                                {formatDate(apt.date, ar ? "ar" : "en")} · {formatTime(apt.date, ar ? "ar" : "en")}
                              </div>
                            </div>
                            <span className="text-xs text-slate-600 font-mono">#{apt.appointmentNumber}</span>
                          </div>
                          {apt.reason && (
                            <p className="text-xs text-slate-500">
                              <span className="text-slate-600 font-medium">{ar ? "السبب: " : "Reason: "}</span>{apt.reason}
                            </p>
                          )}
                          <div className="space-y-2">
                            {apt.diagnosis && (
                              <div className="rounded-lg bg-blue-500/8 border border-blue-500/15 px-3 py-2">
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">{ar ? "التشخيص / الحالة المرضية" : "Diagnosis"}</p>
                                <p className="text-xs text-slate-300 leading-relaxed">{apt.diagnosis}</p>
                              </div>
                            )}
                            {apt.prescription && (
                              <div className="rounded-lg bg-purple-500/8 border border-purple-500/15 px-3 py-2">
                                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <Pill className="h-2.5 w-2.5" />{ar ? "الوصفة الطبية" : "Prescription"}
                                </p>
                                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{apt.prescription}</p>
                              </div>
                            )}
                            {apt.notes && (
                              <div className="rounded-lg bg-slate-700/30 border border-white/6 px-3 py-2">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <FileText className="h-2.5 w-2.5" />{ar ? "ملاحظات" : "Notes"}
                                </p>
                                <p className="text-xs text-slate-500 leading-relaxed">{apt.notes}</p>
                              </div>
                            )}
                            {!apt.diagnosis && !apt.prescription && !apt.notes && (
                              <p className="text-xs text-slate-700 italic">{ar ? "لم تُسجَّل بيانات طبية لهذه الزيارة" : "No medical data recorded"}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
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
            {saveError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />{saveError}
              </div>
            )}
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
