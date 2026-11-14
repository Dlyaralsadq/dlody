"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, FileText, Pill, Clock, User, Calendar, Archive, Pencil, AlertCircle, X } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import TimeSlotSelect from "@/components/ui/TimeSlotSelect";
import { doctorEditAppointment } from "@/app/actions/doctorPortal";
import { SCROLL_CONTAINER } from "@/lib/scrollUi";

interface PatientRow {
  id: string;
  name: string;
  phone: string;
  gender?: string | null;
  bloodType?: string | null;
}

interface AppointmentRow {
  id: string;
  appointmentNumber: string;
  date: string | Date;
  type: string;
  reason: string | null;
  diagnosis: string | null;
  notes: string | null;
  prescription: string | null;
  isPaid: boolean;
  queueNumber: number | null;
  completedAt: string | Date | null;
  patient: PatientRow;
}

export default function DoctorAppointmentsArchiveClient({
  pending,
  completed,
  locale,
  doctorId,
}: {
  pending: AppointmentRow[];
  completed: AppointmentRow[];
  locale: string;
  doctorId: string;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [editApt, setEditApt] = useState<AppointmentRow | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  const typeLabel: Record<string, string> = {
    consultation: ar ? "استشارة" : "Consultation",
    followUp: ar ? "متابعة" : "Follow-up",
    emergency: ar ? "طارئ" : "Emergency",
    procedure: ar ? "إجراء" : "Procedure",
  };

  function openEdit(apt: AppointmentRow) {
    const d = new Date(apt.date);
    setEditDate(d.toISOString().split("T")[0]);
    setEditTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    setEditError("");
    setEditApt(apt);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editApt) return;
    setSaving(true);
    setEditError("");
    const fd = new FormData(e.currentTarget);

    const result = await doctorEditAppointment(editApt.id, doctorId, {
      date: editDate || undefined,
      time: editTime || undefined,
      reason: (fd.get("reason") as string) || undefined,
      notes: (fd.get("notes") as string) || undefined,
    });

    if (!result.success) {
      setSaving(false);
      setEditError(
        result.error === "slot_taken"
          ? (ar ? "هذا الوقت محجوز مسبقاً، الرجاء اختيار وقت آخر" : "This time slot is already booked, please choose another")
          : (ar ? "حدث خطأ أثناء الحفظ" : "An error occurred while saving")
      );
      return;
    }

    const patientId = editApt.patient.id;
    const phone = fd.get("patPhone") as string;
    const gender = fd.get("patGender") as string;
    const bloodType = fd.get("patBlood") as string;
    if (patientId) {
      await fetch("/api/patients/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, doctorId, phone: phone || undefined, gender: gender || undefined, bloodType: bloodType || undefined }),
      });
    }

    setSaving(false);
    setEditApt(null);
    router.refresh();
  }

  const AppointmentCard = ({ apt, showComplete }: { apt: AppointmentRow; showComplete: boolean }) => (
    <div className="card p-5 hover:border-[#3d4f70] transition-colors">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="patient-avatar patient-avatar-lg">{apt.patient.name[0]}</div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-white">{apt.patient.name}</h3>
              {apt.queueNumber && (
                <span className="text-xs text-slate-500 font-mono bg-slate-800/60 px-2 py-0.5 rounded">#{apt.queueNumber}</span>
              )}
              <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-xs text-slate-400">
                {typeLabel[apt.type] ?? apt.type}
              </span>
              {apt.isPaid && (
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-xs text-emerald-400">
                  {ar ? "مدفوع" : "Paid"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />{formatDate(apt.date, locale)} · {formatTime(apt.date, locale)}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />{apt.patient.phone}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {showComplete && apt.completedAt && (
            <p className="text-xs text-slate-600">
              {ar ? "أُنجز: " : "Done: "}{formatDate(apt.completedAt, locale)}
            </p>
          )}
          {!showComplete && (
            <button
              onClick={() => openEdit(apt)}
              className="flex items-center gap-1.5 rounded-lg border border-[#2a3347] bg-[#111827] px-2.5 py-1.5 text-xs text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />{ar ? "تعديل" : "Edit"}
            </button>
          )}
        </div>
      </div>

      {(apt.diagnosis || apt.prescription || apt.notes) && (
        <div className="mt-4 border-t border-[#1e2536] pt-4 space-y-3">
          {apt.diagnosis && (
            <div className="rounded-xl bg-blue-500/8 border border-blue-500/15 p-3">
              <p className="text-xs font-semibold text-blue-400 mb-1.5 flex items-center gap-1.5">
                <CheckCheck className="h-3 w-3" />{ar ? "التشخيص" : "Diagnosis"}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">{apt.diagnosis}</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {apt.prescription && (
              <div className="rounded-xl bg-purple-500/8 border border-purple-500/15 p-3">
                <p className="text-xs font-semibold text-purple-400 mb-1.5 flex items-center gap-1.5">
                  <Pill className="h-3 w-3" />{ar ? "الوصفة الطبية" : "Prescription"}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">{apt.prescription}</p>
              </div>
            )}
            {apt.notes && (
              <div className="rounded-xl bg-slate-700/30 border border-[#2a3347] p-3">
                <p className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <FileText className="h-3 w-3" />{ar ? "ملاحظات" : "Notes"}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">{apt.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Archive className="h-5 w-5 text-indigo-400" />
          {ar ? "سجل المواعيد" : "Appointments Archive"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {ar ? `${pending.length} موعد قادم · ${completed.length} موعد مكتمل` : `${pending.length} upcoming · ${completed.length} completed`}
        </p>
      </div>

      {/* ── Upcoming / Pending ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#1e2536]" />
          <h2 className="text-sm font-semibold text-indigo-400 flex items-center gap-2 px-2">
            <Calendar className="h-4 w-4" />
            {ar ? "المواعيد القادمة" : "Upcoming Appointments"}
            <span className="rounded-full bg-indigo-500/15 border border-indigo-500/25 px-2 py-0.5 text-xs">{pending.length}</span>
          </h2>
          <div className="h-px flex-1 bg-[#1e2536]" />
        </div>

        {pending.length === 0 ? (
          <div className="card p-8 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-700" />
            <p className="text-slate-600 text-sm">{ar ? "لا توجد مواعيد قادمة" : "No upcoming appointments"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((apt) => <AppointmentCard key={apt.id} apt={apt} showComplete={false} />)}
          </div>
        )}
      </div>

      {/* ── Completed ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#1e2536]" />
          <h2 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 px-2">
            <CheckCheck className="h-4 w-4" />
            {ar ? "المواعيد المنجزة" : "Completed Appointments"}
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-xs">{completed.length}</span>
          </h2>
          <div className="h-px flex-1 bg-[#1e2536]" />
        </div>

        {completed.length === 0 ? (
          <div className="card p-8 text-center">
            <CheckCheck className="h-8 w-8 mx-auto mb-2 text-slate-700" />
            <p className="text-slate-600 text-sm">{ar ? "لا توجد مواعيد مكتملة بعد" : "No completed appointments yet"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completed.map((apt) => <AppointmentCard key={apt.id} apt={apt} showComplete={true} />)}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setEditApt(null)} />
          <div className={`relative w-full max-w-md rounded-2xl border border-white/8 bg-[#0f1629] shadow-2xl p-6 animate-fade-up space-y-4 max-h-[90vh] ${SCROLL_CONTAINER}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{ar ? "تعديل الموعد وبيانات المريض" : "Edit Appointment & Patient Info"}</h3>
              <button type="button" onClick={() => setEditApt(null)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {editError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />{editError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3">
              <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">{ar ? "تفاصيل الموعد" : "Appointment"}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="form-label">{ar ? "التاريخ" : "Date"}</label>
                  <input type="date" value={editDate} onChange={(e) => { setEditDate(e.target.value); setEditTime(""); }} className="form-input text-sm" dir="ltr" />
                </div>
                <TimeSlotSelect doctorId={doctorId} date={editDate} locale={locale}
                  value={editTime} onChange={setEditTime} excludeAppointmentId={editApt.id}
                  label={ar ? "الوقت" : "Time"} className="form-input text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="form-label">{ar ? "سبب الزيارة" : "Reason"}</label>
                <input name="reason" defaultValue={editApt.reason ?? ""} className="form-input text-sm" dir="auto" />
              </div>
              <div className="space-y-1.5">
                <label className="form-label">{ar ? "ملاحظات" : "Notes"}</label>
                <textarea name="notes" defaultValue={editApt.notes ?? ""} rows={2} className="form-input text-sm resize-none" dir="auto" />
              </div>

              <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider border-t border-white/8 pt-3">{ar ? "بيانات المريض" : "Patient Info"}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="form-label">{ar ? "الهاتف" : "Phone"}</label>
                  <input type="tel" name="patPhone" defaultValue={editApt.patient.phone} className="form-input text-sm" dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <label className="form-label">{ar ? "الجنس" : "Gender"}</label>
                  <select name="patGender" defaultValue={editApt.patient.gender ?? ""} className="form-input text-sm">
                    <option value="">{ar ? "—" : "—"}</option>
                    <option value="male">{ar ? "ذكر" : "Male"}</option>
                    <option value="female">{ar ? "أنثى" : "Female"}</option>
                    <option value="unknown">{ar ? "غير محدد" : "Unknown"}</option>
                  </select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="form-label">{ar ? "فصيلة الدم" : "Blood type"}</label>
                  <select name="patBlood" defaultValue={editApt.patient.bloodType ?? ""} className="form-input text-sm">
                    <option value="">—</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditApt(null)} className="flex-1 rounded-xl border border-white/8 bg-white/4 py-2 text-sm text-slate-400 hover:bg-white/8 transition-colors">{ar ? "إلغاء" : "Cancel"}</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50">
                  {saving ? "..." : (ar ? "حفظ" : "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
