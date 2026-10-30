"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Stethoscope, Users, ChevronRight, ClipboardList,
  CheckCircle2, Clock, FileText, Phone, Activity,
  PlayCircle, Monitor, Calendar, NotebookPen,
  AlertCircle, DoorOpen, CheckCheck, Banknote,
  FlaskConical, ChevronDown, ArrowRightCircle
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import { callNextPatient, confirmPatientEntry, completeAppointment, holdPatientForTest, callOnHoldPatient } from "@/app/actions/clinic";
import { formatTime } from "@/lib/utils";
import type { SpecialtyConfig } from "@/lib/specialtyConfig";

interface Appointment {
  id: string; appointmentNumber: string; date: Date;
  type: string; status: string; arrivalStatus: string;
  queueNumber: number | null; reason: string | null; isPaid: boolean;
  holdReason?: string | null;
  returnedFromTest?: boolean;
  diagnosis: string | null; prescription: string | null; notes: string | null;
  patient: { id: string; name: string; nameAr: string | null; phone: string; bloodType: string | null; };
}

const typeLabel = (type: string, ar: boolean) => ({
  consultation: ar ? "استشارة" : "Consultation",
  followUp: ar ? "متابعة" : "Follow-up",
  emergency: ar ? "طارئ" : "Emergency",
  procedure: ar ? "إجراء" : "Procedure",
}[type] ?? type);

export default function DoctorClinicClient({ doctor, queue, deletedBySecretary = [], locale, specialtyConfig }: {
  doctor: any; queue: Appointment[]; deletedBySecretary?: any[]; locale: string;
  specialtyConfig?: SpecialtyConfig;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [consultOpen, setConsultOpen] = useState(false);
  const [activeApt, setActiveApt] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);
  const [holdMenuOpen, setHoldMenuOpen] = useState(false);
  const [holdTargetId, setHoldTargetId] = useState<string | null>(null);

  // Auto-refresh every 5 seconds to pick up secretary actions
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [router]);

  const ar = locale === "ar";

  const called  = queue.find(a => a.arrivalStatus === "called");
  const current = queue.find(a => a.arrivalStatus === "with_doctor");
  const waiting = queue.filter(a => a.arrivalStatus === "arrived");
  const onHold  = queue.filter(a => a.arrivalStatus === "on_hold");
  const pending = queue.filter(a => a.arrivalStatus === "pending");

  const act = (fn: () => Promise<unknown>) => {
    startTransition(async () => { await fn(); router.refresh(); });
  };

  const handleComplete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeApt) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await completeAppointment(activeApt.id, doctor.id, {
      prescription: fd.get("prescription") as string,
      notes: fd.get("notes") as string,
    });
    setSaving(false);
    setConsultOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-4">

      {deletedBySecretary.length > 0 && (
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 space-y-2">
          <p className="text-sm font-semibold text-rose-300">
            {ar ? "مواعيد حذفها السكرتير اليوم" : "Appointments deleted by secretary today"}
          </p>
          {deletedBySecretary.map((apt: any) => (
            <div key={apt.id} className="text-xs text-rose-200/80 flex justify-between gap-2">
              <span>{apt.patient?.name} · {apt.appointmentNumber}</span>
              <span className="text-rose-300/60">{apt.deleteNote}</span>
            </div>
          ))}
        </div>
      )}

      {/* Doctor banner */}
      <div className="rounded-2xl overflow-hidden border border-indigo-500/15">
        <div className="bg-gradient-to-r from-[#1e1b4b] via-[#1a1f5e] to-[#0f172a] px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600/30 border border-indigo-500/30 text-white text-lg font-black overflow-hidden">
                {doctor.logoUrl ? (
                  <img src={doctor.logoUrl} alt="logo" className="h-full w-full object-cover" />
                ) : (
                  doctor.name[0]
                )}
              </div>
              <div>
                <p className="font-bold text-white">{ar ? doctor.nameAr : doctor.name}</p>
                <p className="text-xs text-indigo-300">{ar ? doctor.specialty.nameAr : doctor.specialty.name}</p>
              </div>
            </div>
            {/* Quick stats row */}
            <div className="flex items-center gap-3 text-xs">
              {[
                { n: waiting.length,  label: ar ? "انتظار" : "Waiting",  color: "text-amber-400" },
                { n: onHold.length,   label: ar ? "فحص خارجي" : "On Hold", color: "text-orange-400" },
                { n: pending.length,  label: ar ? "لم يصلوا" : "Pending",  color: "text-slate-500" },
              ].map(({ n, label, color }) => (
                <div key={label} className="flex items-center gap-1.5 rounded-lg bg-white/8 px-3 py-1.5">
                  <span className={`text-base font-black ${color}`}>{n}</span>
                  <span className="text-slate-400">{label}</span>
                </div>
              ))}
              <div className="hidden sm:flex gap-2 ms-2">
                <Link href={`/${locale}/secretary`}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                  <ClipboardList className="h-3.5 w-3.5" />{ar ? "الاستقبال" : "Reception"}
                </Link>
                <Link href={`/${locale}/waiting?d=${doctor.id}`} target="_blank"
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                  <Monitor className="h-3.5 w-3.5" />{ar ? "الشاشة" : "Screen"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid: 3 columns on large screens */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* ── COL 1: Active session ── */}
        <div className="space-y-4 lg:col-span-2">

          {/* Called patient alert */}
          {called && (
            <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/8 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/20 text-yellow-300 font-black text-sm animate-pulse-ring">
                  {called.queueNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-yellow-400/80">{ar ? "⚡ تم النداء — بانتظار الدخول" : "⚡ Called — Awaiting Entry"}</p>
                  <p className="text-sm font-semibold text-white truncate">{called.patient.name}</p>
                </div>
                <Button variant="success" size="sm" className="gap-1.5 shrink-0"
                  onClick={() => act(() => confirmPatientEntry(called.id, doctor.id))} disabled={isPending}>
                  <DoorOpen className="h-4 w-4" />{ar ? "تأكيد الدخول" : "Confirm Entry"}
                </Button>
              </div>
            </div>
          )}

          {/* Current patient card */}
          {current ? (
            <div className="card overflow-hidden">
              <div className="bg-blue-600/12 border-b border-blue-500/20 px-5 py-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400 animate-pulse" />
                <span className="text-sm font-semibold text-blue-300">{ar ? "المريض الحالي" : "Current Patient"}</span>
                <span className="ms-auto text-xs text-blue-400/60 font-mono">#{current.queueNumber} · {formatTime(current.date, locale)}</span>
              </div>
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-xl font-black shadow-lg shadow-blue-900/30">
                    {current.patient.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-white">{current.patient.name}</h2>
                      {current.patient.bloodType && (
                        <span className="rounded-md bg-red-500/15 border border-red-500/25 px-2 py-0.5 text-xs font-bold text-red-400">{current.patient.bloodType}</span>
                      )}
                      {!current.isPaid && (
                        <span className="rounded-md bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-xs text-amber-400 flex items-center gap-1">
                          <Banknote className="h-3 w-3" />{ar ? "لم يدفع" : "Unpaid"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="h-3.5 w-3.5" />{current.patient.phone}
                    </p>
                    {current.reason && (
                      <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-500/8 border border-amber-500/15 px-3 py-2">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
                        <p className="text-xs text-amber-300/90">{current.reason}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button className="flex-1 gap-2 min-w-0" size="sm"
                    onClick={() => { setActiveApt(current); setConsultOpen(true); }}>
                    <NotebookPen className="h-4 w-4" />{ar ? "إنهاء الكشف وتسجيله" : "Complete Consultation"}
                  </Button>
                  {specialtyConfig?.hasHoldForTest && (
                    <Button variant="outline" size="sm" className="gap-1.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 shrink-0"
                      onClick={() => { setHoldTargetId(current.id); setHoldMenuOpen(true); }}>
                      <FlaskConical className="h-4 w-4" />
                      {ar ? "إرسال لفحص" : "Send for Test"}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {waiting.length > 0 && (
                    <Button variant="outline" size="sm" className="gap-1.5 shrink-0"
                      onClick={() => act(() => callNextPatient(doctor.id))} disabled={isPending}>
                      <PlayCircle className="h-4 w-4" />{ar ? "التالي" : "Next"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : !called && (
            <div className="card p-8 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 border border-[#2a3347]">
                <Stethoscope className="h-7 w-7 text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm mb-3">
                {waiting.length > 0 ? (ar ? "اضغط لاستدعاء المريض التالي" : "Press to call next patient") : (ar ? "لا يوجد مرضى في الانتظار" : "No patients waiting")}
              </p>
              {waiting.length > 0 && (
                <Button size="md" className="gap-2 mx-auto" onClick={() => act(() => callNextPatient(doctor.id))} disabled={isPending} loading={isPending}>
                  <PlayCircle className="h-4 w-4" />
                  {ar ? `استدعاء التالي (${waiting.length})` : `Call Next (${waiting.length})`}
                </Button>
              )}
            </div>
          )}

          {/* Waiting queue */}
          {waiting.length > 0 && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e2536]">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  {ar ? "قائمة الانتظار" : "Waiting Queue"}
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-xs text-amber-400 font-bold">{waiting.length}</span>
                  {waiting.filter(a => (a as any).returnedFromTest).length > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-xs text-emerald-400">
                      <FlaskConical className="h-3 w-3" />
                      {waiting.filter(a => (a as any).returnedFromTest).length} {ar ? "عائد" : "returning"}
                    </span>
                  )}
                </h2>
                {!current && !called && (
                  <Button size="sm" className="gap-1" onClick={() => act(() => callNextPatient(doctor.id))} disabled={isPending}>
                    <PlayCircle className="h-3.5 w-3.5" />{ar ? "استدعاء" : "Call"}
                  </Button>
                )}
              </div>
              <div className="divide-y divide-[#1e2536]">
                {waiting.map(apt => (
                  <div key={apt.id} className={`flex items-center gap-4 px-5 py-3 transition-colors ${(apt as any).returnedFromTest ? "bg-emerald-500/6 border-b border-emerald-500/15" : "hover:bg-white/2"}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-black text-sm ${
                      (apt as any).returnedFromTest
                        ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                        : "bg-amber-500/15 border border-amber-500/20 text-amber-400"
                    }`}>
                      {apt.queueNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{apt.patient.name}</p>
                        {(apt as any).returnedFromTest && (
                          <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-xs text-emerald-400 font-semibold">
                            <FlaskConical className="h-3 w-3" />{ar ? "عاد من الفحص" : "Returned"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{apt.patient.phone}</p>
                    </div>
                    <p className="text-xs text-slate-500 font-mono shrink-0">{formatTime(apt.date, locale)}</p>
                    {!apt.isPaid && <Banknote className="h-3.5 w-3.5 text-amber-500/50 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── COL 2: On Hold + Pending ── */}
        <div className="space-y-4">

          {/* On Hold – patients sent for external test */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#1e2536]">
              <FlaskConical className="h-4 w-4 text-orange-400" />
              <h2 className="text-sm font-semibold text-white">{ar ? "في فحص خارجي" : "External Test"}</h2>
              <span className={`ms-auto rounded-full px-2 py-0.5 text-xs font-bold ${onHold.length > 0 ? "bg-orange-500/15 border border-orange-500/25 text-orange-400" : "bg-slate-700/50 text-slate-600"}`}>
                {onHold.length}
              </span>
            </div>
            <div className="divide-y divide-[#1e2536]">
              {onHold.length === 0 ? (
                <p className="px-5 py-6 text-center text-xs text-slate-700">{ar ? "لا يوجد" : "None"}</p>
              ) : onHold.map(apt => (
                <div key={apt.id} className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400 text-xs font-bold">
                      {apt.patient.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{apt.patient.name}</p>
                      <p className="text-xs text-orange-400/80 flex items-center gap-1">
                        <FlaskConical className="h-3 w-3" />
                        {(apt as any).holdReason ?? (ar ? "فحص خارجي" : "External")}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => act(() => callOnHoldPatient(apt.id, doctor.id))} disabled={isPending}>
                    <ArrowRightCircle className="h-3.5 w-3.5" />
                    {ar ? "استدعاء بعد الفحص" : "Call Back"}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Pending – not yet arrived */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#1e2536]">
              <Calendar className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-white">{ar ? "لم يصلوا بعد" : "Not Arrived"}</h2>
              <span className="ms-auto rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-500 font-medium">{pending.length}</span>
            </div>
            <div className="divide-y divide-[#1e2536] max-h-52 overflow-y-auto">
              {pending.length === 0 ? (
                <p className="px-5 py-5 text-center text-xs text-slate-700">{ar ? "الجميع وصل" : "All arrived"}</p>
              ) : pending.map(apt => (
                <div key={apt.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 text-slate-600 text-xs font-semibold">
                    {apt.patient.name[0]}
                  </div>
                  <p className="flex-1 text-xs text-slate-400 truncate">{apt.patient.name}</p>
                  <span className="text-xs text-slate-600 font-mono">{formatTime(apt.date, locale)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nav links */}
          <div className="card p-3 space-y-0.5">
            {[
              { href: `/${locale}/doctor/patients`, icon: Users, label: ar ? "مرضاي" : "My Patients" },
              { href: `/${locale}/doctor/appointments`, icon: FileText, label: ar ? "سجل المواعيد" : "Archive" },
            ].map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
                <Icon className="h-4 w-4 shrink-0" /><span className="flex-1">{label}</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-30 rtl:rotate-180" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Hold for Test Modal */}
      {holdMenuOpen && holdTargetId && specialtyConfig?.holdOptions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setHoldMenuOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-[#2a3347] bg-[#111827] shadow-2xl overflow-hidden animate-fade-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2536]">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-amber-400" />
                <h3 className="font-semibold text-white text-sm">
                  {ar ? specialtyConfig.holdSectionTitle?.ar ?? "إرسال لفحص" : specialtyConfig.holdSectionTitle?.en ?? "Send for Test"}
                </h3>
              </div>
              <button onClick={() => setHoldMenuOpen(false)} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
            </div>
            <div className="p-2 max-h-72 overflow-y-auto">
              {specialtyConfig.holdOptions.map(opt => (
                <button key={opt.value}
                  onClick={() => { setHoldMenuOpen(false); setHoldTargetId(null); act(() => holdPatientForTest(holdTargetId!, doctor.id, ar ? opt.labelAr : opt.labelEn)); }}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-amber-500/10 hover:text-amber-200 transition-colors text-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-lg">🔬</span>
                  {ar ? opt.labelAr : opt.labelEn}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Consultation Modal */}
      <Modal isOpen={consultOpen} onClose={() => setConsultOpen(false)}
        title={ar ? "إنهاء الكشف" : "Complete Consultation"} size="md"
        footer={<>
          <Button variant="secondary" onClick={() => setConsultOpen(false)} disabled={saving}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="consult-form" loading={saving} variant="success">
            <CheckCheck className="h-4 w-4" />{ar ? "إنهاء وأرشفة" : "Complete & Archive"}
          </Button>
        </>}>
        {activeApt && (
          <form id="consult-form" onSubmit={handleComplete} className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-blue-500/8 border border-blue-500/15 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-white font-bold">
                {activeApt.patient.name[0]}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">{activeApt.patient.name}</p>
                <p className="text-xs text-slate-500">{formatTime(activeApt.date, locale)} · {typeLabel(activeApt.type, ar)}</p>
              </div>
            </div>
            <Textarea name="prescription" label={ar ? "الوصفة الطبية" : "Prescription"} rows={3}
              defaultValue={activeApt.prescription ?? ""} placeholder={ar ? "الأدوية والجرعات..." : "Medications and dosages..."} />
            <Textarea name="notes" label={ar ? "ملاحظات" : "Notes"} rows={2}
              defaultValue={activeApt.notes ?? ""} />
            <p className="text-xs text-slate-600 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500/60" />
              {ar ? "سيُحذف من قائمة اليوم وينتقل للأرشيف" : "Will be removed from today's list and archived"}
            </p>
          </form>
        )}
      </Modal>
    </div>
  );
}
