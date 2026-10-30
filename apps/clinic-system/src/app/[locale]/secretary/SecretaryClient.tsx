"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarPlus, CheckCircle2, Clock, User, Stethoscope,
  Phone, Search, DoorOpen, Banknote, MonitorPlay,
  UserCheck, AlertCircle, CheckCheck, ChevronDown, ChevronRight, FlaskConical, RotateCcw, PlayCircle, Pencil, Trash2
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { checkInPatient, quickBookAppointment, confirmPatientEntry, markPayment, patientReturnedFromTest, callNextPatient, completeAppointment, callOnHoldPatient, secretaryDeleteAppointment, secretaryEditAppointment } from "@/app/actions/clinic";
import type { SpecialtyConfig } from "@/lib/specialtyConfig";

interface Appointment {
  id: string; appointmentNumber: string; date: Date; type: string;
  status: string; arrivalStatus: string; queueNumber: number | null;
  reason: string | null; isPaid: boolean; source?: string;
  patient: { id: string; name: string; nameAr: string | null; phone: string; };
}

const STATUS_CFG: Record<string, { ar: string; en: string; dot: string; bg: string; text: string }> = {
  pending:     { ar: "لم يصل",    en: "Pending",     dot: "bg-slate-500",         bg: "bg-slate-500/10",  text: "text-slate-400" },
  arrived:     { ar: "وصل",       en: "Arrived",     dot: "bg-amber-400",          bg: "bg-amber-500/10",  text: "text-amber-400" },
  called:      { ar: "تم النداء", en: "Called",      dot: "bg-yellow-400 animate-pulse", bg: "bg-yellow-500/15", text: "text-yellow-300" },
  with_doctor: { ar: "مع الطبيب", en: "With Doctor", dot: "bg-blue-400",           bg: "bg-blue-500/10",   text: "text-blue-400" },
  on_hold:     { ar: "فحص خارجي", en: "External Test", dot: "bg-amber-500 animate-pulse", bg: "bg-amber-500/15", text: "text-amber-300" },
  done:        { ar: "انتهى",     en: "Done",        dot: "bg-emerald-400",        bg: "bg-emerald-500/10",text: "text-emerald-400" },
};

const TYPE_LABEL: Record<string, { ar: string; en: string }> = {
  consultation: { ar: "استشارة",   en: "Consultation" },
  followUp:     { ar: "متابعة",    en: "Follow-up" },
  emergency:    { ar: "طارئ",      en: "Emergency" },
  procedure:    { ar: "إجراء طبي", en: "Procedure" },
};

function groupByDate(appointments: Appointment[]): Record<string, Appointment[]> {
  return appointments.reduce((acc, apt) => {
    const key = new Date(apt.date).toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);
}

function formatDayHeader(dateStr: string, locale: string): { label: string; isToday: boolean; isTomorrow: boolean } {
  const d = new Date(dateStr);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const dDay = new Date(d); dDay.setHours(0, 0, 0, 0);

  const isToday = dDay.getTime() === today.getTime();
  const isTomorrow = dDay.getTime() === tomorrow.getTime();

  const label = d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return { label, isToday, isTomorrow };
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

export default function SecretaryClient({ appointments, todayQueue, doctor, patients, doctorId, locale, specialtyConfig, secretaryUserId }: {
  appointments: Appointment[]; todayQueue?: Appointment[]; doctor: any; patients: any[];
  doctorId: string; locale: string; specialtyConfig?: SpecialtyConfig; secretaryUserId?: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});
  const [paymentConfirmId, setPaymentConfirmId] = useState<string | null>(null);
  const [editApt, setEditApt] = useState<Appointment | null>(null);
  const [deleteAptId, setDeleteAptId] = useState<string | null>(null);

  const ar = locale === "ar";

  const today = new Date();
  const todayStr = today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // Stats for today only
  const todayApts = appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString());
  const waiting   = todayApts.filter(a => a.arrivalStatus === "arrived");
  const called    = todayApts.find(a => a.arrivalStatus === "called");
  const withDoc   = todayApts.find(a => a.arrivalStatus === "with_doctor");
  const onHold    = todayApts.filter(a => a.arrivalStatus === "on_hold");

  const filtered = search
    ? appointments.filter(a =>
        a.patient.name.toLowerCase().includes(search.toLowerCase()) ||
        a.patient.phone.includes(search))
    : appointments;

  const grouped = groupByDate(filtered);
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const act = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    await fn();
    setLoading(false);
    router.refresh();
  };

  const handleBook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await quickBookAppointment(doctorId, {
      patientName: fd.get("patientName") as string,
      patientPhone: fd.get("patientPhone") as string,
      patientGender: fd.get("patientGender") as string,
      date: fd.get("date") as string,
      time: fd.get("time") as string,
      type: fd.get("type") as string,
      notes: fd.get("notes") as string || undefined,
    });
    setLoading(false);
    if (result.success) { setBookingOpen(false); router.refresh(); }
  };

  const genderOpts = [{ value: "male", label: ar ? "ذكر" : "Male" }, { value: "female", label: ar ? "أنثى" : "Female" }];
  const typeOpts   = Object.entries(TYPE_LABEL).map(([v, l]) => ({ value: v, label: ar ? l.ar : l.en }));

  const toggleDay = (key: string) => setCollapsedDays(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{ar ? "استقبال العيادة" : "Clinic Reception"}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{todayStr}</p>
          {doctor && (
            <p className="mt-1.5 text-sm text-indigo-300 flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" />
              {ar ? doctor.nameAr : doctor.name} · {ar ? doctor.specialty.nameAr : doctor.specialty.name}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/${locale}/waiting?d=${doctorId}`} target="_blank"
            className="flex items-center gap-1.5 rounded-xl border border-[#2a3347] bg-[#111827] px-3 py-2 text-xs text-slate-400 hover:text-white hover:border-indigo-500/40 transition-all">
            <MonitorPlay className="h-3.5 w-3.5" />{ar ? "شاشة الانتظار" : "Waiting Screen"}
          </Link>
          <Button onClick={() => setBookingOpen(true)}>
            <CalendarPlus className="h-4 w-4" />{ar ? "حجز موعد" : "New Booking"}
          </Button>
        </div>
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: ar ? "مواعيد اليوم" : "Today", n: todayApts.length, color: "indigo", icon: CalendarPlus },
          { label: ar ? "في الانتظار" : "Waiting",  n: waiting.length, color: "amber",  icon: Clock },
          { label: ar ? "مع الطبيب" : "With Doctor", n: (called ? 1 : 0) + (withDoc ? 1 : 0), color: "blue", icon: Stethoscope },
          { label: ar ? "فحص خارجي" : "On Hold", n: onHold.length, color: "amber", icon: FlaskConical },
        ].map(({ label, n, color, icon: Icon }) => (
          <div key={label} className="card p-4">
            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-${color}-500/10`}>
              <Icon className={`h-4.5 w-4.5 text-${color}-400`} />
            </div>
            <p className="text-2xl font-black text-white">{n}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Called patient alert */}
      {called && (
        <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/8 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/20 text-yellow-300 font-black animate-pulse-ring">
                {called.queueNumber}
              </div>
              <div>
                <p className="text-xs text-yellow-400 font-medium">{ar ? "⚡ تم النداء — الشاشة تومض" : "⚡ Called — Screen alerting"}</p>
                <p className="text-sm font-semibold text-white">{called.patient.name}</p>
              </div>
            </div>
            <Button variant="success" size="sm" className="gap-1.5 shrink-0"
              onClick={() => act(() => confirmPatientEntry(called.id, doctorId))} disabled={loading}>
              <DoorOpen className="h-3.5 w-3.5" />{ar ? "تأكيد الدخول" : "Confirm Entry"}
            </Button>
          </div>
        </div>
      )}

      {/* On Hold patients alert */}
      {onHold.length > 0 && (
        <div className="card overflow-hidden border-amber-500/20">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[#1e2536] bg-amber-500/8">
            <FlaskConical className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">{ar ? "مرضى في انتظار فحص خارجي" : "Patients Waiting for External Test"}</span>
            <span className="ms-auto rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400 font-bold">{onHold.length}</span>
          </div>
          <div className="divide-y divide-[#1e2536]">
            {onHold.map(apt => (
              <div key={apt.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-300 font-bold text-sm">
                  {apt.patient.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{apt.patient.name}</p>
                  <p className="text-xs text-amber-400 flex items-center gap-1.5">
                    <FlaskConical className="h-3 w-3" />{(apt as any).holdReason ?? (ar ? "فحص خارجي" : "External test")}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 shrink-0"
                  onClick={() => act(() => patientReturnedFromTest(apt.id, doctorId))} disabled={loading}>
                  <RotateCcw className="h-3.5 w-3.5" />{ar ? "عاد من الفحص" : "Returned"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dentistry: Secretary Queue Management Panel */}
      {specialtyConfig?.secretaryCanManageQueue && (() => {
        const queue = todayQueue ?? [];
        const qCalled  = queue.find(a => a.arrivalStatus === "called");
        const qCurrent = queue.find(a => a.arrivalStatus === "with_doctor");
        const qWaiting = queue.filter(a => a.arrivalStatus === "arrived");
        return (
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-indigo-500/15">
              <span className="text-lg">🦷</span>
              <h2 className="text-sm font-semibold text-indigo-300">{ar ? "إدارة الطابور — صلاحية السكرتير" : "Queue Management — Secretary Mode"}</h2>
              <span className="ms-auto text-xs text-indigo-400/60">{ar ? `${qWaiting.length} في الانتظار` : `${qWaiting.length} waiting`}</span>
            </div>
            <div className="p-4 space-y-3">
              {/* Currently with doctor */}
              {qCurrent && (
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
                  <p className="text-xs text-blue-400/70 mb-2 uppercase tracking-wider">{ar ? "المريض الحالي" : "Current Patient"}</p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-white font-bold">{qCurrent.patient.name[0]}</div>
                      <div>
                        <p className="text-sm font-semibold text-white">{qCurrent.patient.name}</p>
                        <p className="text-xs text-slate-500">#{qCurrent.queueNumber}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="success" className="gap-1.5 text-xs"
                        onClick={async () => {
                          setLoading(true);
                          await completeAppointment(qCurrent.id, doctorId, {});
                          setLoading(false); router.refresh();
                        }} disabled={loading}>
                        <CheckCheck className="h-3.5 w-3.5" />{ar ? "إنهاء الجلسة" : "Complete"}
                      </Button>
                      {qWaiting.length > 0 && (
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                          onClick={() => act(() => callNextPatient(doctorId))} disabled={loading}>
                          <PlayCircle className="h-3.5 w-3.5" />{ar ? "التالي" : "Next"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Called patient */}
              {qCalled && !qCurrent && (
                <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                    <p className="text-sm text-yellow-300">{qCalled.patient.name} — {ar ? "تم النداء" : "Called"}</p>
                  </div>
                  <Button size="sm" variant="success" className="gap-1 text-xs"
                    onClick={() => act(() => confirmPatientEntry(qCalled.id, doctorId))} disabled={loading}>
                    <DoorOpen className="h-3.5 w-3.5" />{ar ? "دخل" : "Entered"}
                  </Button>
                </div>
              )}
              {/* No current patient */}
              {!qCurrent && !qCalled && (
                <Button className="w-full gap-2" disabled={qWaiting.length === 0 || loading}
                  onClick={() => act(() => callNextPatient(doctorId))}>
                  <PlayCircle className="h-4 w-4" />
                  {qWaiting.length > 0 ? (ar ? `استدعاء المريض التالي (${qWaiting.length})` : `Call Next (${qWaiting.length})`) : (ar ? "لا يوجد مرضى في الانتظار" : "No patients waiting")}
                </Button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Search */}
      <div className="card p-3">
        <div className="relative max-w-sm">
          <Search className="absolute inset-y-0 start-3 my-auto h-4 w-4 text-slate-500" />
          <input value={search} dir="auto" onChange={e => setSearch(e.target.value)}
            placeholder={ar ? "البحث عن مريض..." : "Search patient..."}
            className="form-input ps-9 pe-3 py-2 text-sm w-full" />
        </div>
      </div>

      {/* Grouped by date */}
      {sortedDates.length === 0 ? (
        <div className="card p-14 text-center">
          <CalendarPlus className="h-10 w-10 mx-auto mb-3 text-slate-700" />
          <p className="text-slate-500 text-sm mb-4">{ar ? "لا توجد مواعيد" : "No appointments"}</p>
          <Button variant="outline" size="sm" onClick={() => setBookingOpen(true)}>
            {ar ? "إضافة موعد" : "Add appointment"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(dateKey => {
            const { label, isToday, isTomorrow } = formatDayHeader(dateKey, locale);
            const dayApts = grouped[dateKey];
            const isCollapsed = collapsedDays[dateKey];

            return (
              <div key={dateKey} className="card overflow-hidden">
                {/* Day header */}
                <button
                  onClick={() => toggleDay(dateKey)}
                  className="w-full flex items-center justify-between px-5 py-3.5 border-b border-[#1e2536] hover:bg-white/2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-2 w-2 rounded-full ${isToday ? "bg-emerald-400" : isTomorrow ? "bg-amber-400" : "bg-slate-600"}`} />
                    <span className="text-sm font-semibold text-white">{label}</span>
                    {isToday && (
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-xs text-emerald-400">
                        {ar ? "اليوم" : "Today"}
                      </span>
                    )}
                    {isTomorrow && (
                      <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-xs text-amber-400">
                        {ar ? "غداً" : "Tomorrow"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{dayApts.length} {ar ? "موعد" : "appts"}</span>
                    {isCollapsed ? <ChevronDown className="h-4 w-4 text-slate-600" /> : <ChevronDown className="h-4 w-4 text-slate-600 rotate-180" />}
                  </div>
                </button>

                {/* Appointments table for this day */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{ar ? "المريض" : "Patient"}</th>
                          <th>{ar ? "الوقت" : "Time"}</th>
                          <th>{ar ? "النوع" : "Type"}</th>
                          <th>{ar ? "الحالة" : "Status"}</th>
                          <th>{ar ? "الدفع" : "Payment"}</th>
                          {isToday && <th className="text-center">{ar ? "إجراء" : "Action"}</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {dayApts.map(apt => {
                          const cfg = STATUS_CFG[apt.arrivalStatus] ?? STATUS_CFG.pending;
                          const tl = TYPE_LABEL[apt.type];
                          return (
                            <tr key={apt.id} className={(apt as any).returnedFromTest && apt.arrivalStatus === "arrived" ? "bg-emerald-500/4" : ""}>
                              <td>
                                {apt.queueNumber ? (
                                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 font-bold text-xs">
                                    {apt.queueNumber}
                                  </span>
                                ) : <span className="text-slate-600 text-xs">—</span>}
                              </td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-700/60 text-slate-300 text-xs font-bold">
                                    {apt.patient.name[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">{apt.patient.name}</p>
                                    <p className="text-xs text-slate-500">{apt.patient.phone}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="font-medium text-slate-300 text-sm tabular-nums">
                                {formatTime(apt.date)}
                                {apt.source === "online" && (
                                  <span className="ms-1.5 inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400">
                                    {ar ? "أونلاين" : "Online"}
                                  </span>
                                )}
                              </td>
                              <td className="text-xs text-slate-400">{ar ? tl?.ar : tl?.en}</td>
                              <td>
                                <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                  {ar ? cfg.ar : cfg.en}
                                </span>
                              </td>
                              <td>
                                <button
                                  onClick={() => act(() => markPayment(apt.id, doctorId, !apt.isPaid))}
                                  disabled={loading}
                                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                                    apt.isPaid
                                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                                      : "bg-slate-700/40 text-slate-500 border border-slate-600/30 hover:border-amber-500/30 hover:text-amber-400"
                                  }`}>
                                  <Banknote className="h-3 w-3" />
                                  {apt.isPaid ? (ar ? "مدفوع" : "Paid") : (ar ? "لم يدفع" : "Unpaid")}
                                </button>
                              </td>
                              {isToday && (
                                <td>
                                  <div className="flex justify-center">
                                    {apt.arrivalStatus === "pending" && (
                                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                        onClick={() => act(() => checkInPatient(apt.id, doctorId))} disabled={loading}>
                                        <UserCheck className="h-3.5 w-3.5" />{ar ? "وصل" : "Arrived"}
                                      </Button>
                                    )}
                                    {apt.arrivalStatus === "called" && (
                                      <Button variant="success" size="sm" className="h-7 px-2 text-xs gap-1"
                                        onClick={() => act(() => confirmPatientEntry(apt.id, doctorId))} disabled={loading}>
                                        <DoorOpen className="h-3.5 w-3.5" />{ar ? "دخل" : "Entered"}
                                      </Button>
                                    )}
                                    {apt.arrivalStatus === "arrived" && (
                                      <span className="text-xs text-amber-400 flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />#{apt.queueNumber}
                                      </span>
                                    )}
                                    {apt.arrivalStatus === "with_doctor" && (
                                      <span className="text-xs text-blue-400 flex items-center gap-1">
                                        <Stethoscope className="h-3.5 w-3.5" />{ar ? "عند الطبيب" : "In Session"}
                                      </span>
                                    )}
                                    {apt.arrivalStatus === "done" && (
                                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                                        <CheckCheck className="h-3.5 w-3.5" />{ar ? "انتهى" : "Done"}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {paymentConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPaymentConfirmId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-[#2a3347] bg-[#111827] shadow-2xl p-6 animate-fade-up">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/25">
                <Banknote className="h-7 w-7 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{ar ? "تأكيد الدفع مطلوب" : "Payment Required"}</h3>
                <p className="text-sm text-slate-400 mt-1">{ar ? "هل تم دفع رسوم الكشف؟ يجب تأكيد الدفع قبل تسجيل وصول المريض." : "Has the consultation fee been paid? Payment must be confirmed before check-in."}</p>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={() => setPaymentConfirmId(null)}
                  className="flex-1 rounded-xl border border-[#2a3347] bg-[#1e2536] py-2.5 text-sm text-slate-400 hover:bg-slate-700/50 transition-colors">
                  {ar ? "إلغاء" : "Cancel"}
                </button>
                <button onClick={async () => {
                  const id = paymentConfirmId;
                  setPaymentConfirmId(null);
                  setLoading(true);
                  await markPayment(id, doctorId, true);
                  await checkInPatient(id, doctorId);
                  setLoading(false);
                  router.refresh();
                }}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2">
                  <Banknote className="h-4 w-4" />{ar ? "تأكيد الدفع والوصول" : "Confirm Payment & Arrival"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment + Patient Modal */}
      {editApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setEditApt(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/8 bg-[#0f1629] shadow-2xl p-6 animate-fade-up space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-semibold text-white">{ar ? "تعديل الموعد وبيانات المريض" : "Edit Appointment & Patient Info"}</h3>
            <p className="text-xs text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {ar ? "سيظهر للطبيب أن السكرتير قام بالتعديل" : "Doctor will be notified this was edited by secretary"}
            </p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              const fd = new FormData(e.currentTarget);
              // Update appointment
              await secretaryEditAppointment(editApt.id, doctorId, secretaryUserId ?? "", {
                date: fd.get("date") as string || undefined,
                time: fd.get("time") as string || undefined,
                type: fd.get("type") as string || undefined,
                notes: fd.get("notes") as string || undefined,
              });
              // Update patient info via API
              const patientId = editApt.patient.id;
              const phone = fd.get("patPhone") as string;
              const dob   = fd.get("patDob") as string;
              const gender= fd.get("patGender") as string;
              const blood = fd.get("patBlood") as string;
              if (patientId) {
                await fetch("/api/patients/update", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ patientId, doctorId, phone: phone||undefined, dateOfBirth: dob||undefined, gender: gender||undefined, bloodType: blood||undefined }),
                });
              }
              setLoading(false);
              setEditApt(null);
              router.refresh();
            }} className="space-y-3">
              {/* Appointment fields */}
              <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">{ar ? "تفاصيل الموعد" : "Appointment"}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="form-label">{ar ? "التاريخ" : "Date"}</label>
                  <input type="date" name="date" defaultValue={new Date(editApt.date).toISOString().split("T")[0]} className="form-input text-sm" dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <label className="form-label">{ar ? "الوقت" : "Time"}</label>
                  <input type="time" name="time" defaultValue={`${new Date(editApt.date).getHours().toString().padStart(2,"0")}:${new Date(editApt.date).getMinutes().toString().padStart(2,"0")}`} className="form-input text-sm" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="form-label">{ar ? "النوع" : "Type"}</label>
                  <select name="type" defaultValue={editApt.type} className="form-input text-sm">
                    {typeOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="form-label">{ar ? "ملاحظات" : "Notes"}</label>
                  <textarea name="notes" defaultValue={editApt.reason ?? ""} rows={1} className="form-input text-sm resize-none" dir="auto" />
                </div>
              </div>
              {/* Patient fields */}
              <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider border-t border-white/8 pt-3">{ar ? "بيانات المريض" : "Patient Info"}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="form-label">{ar ? "الهاتف" : "Phone"}</label>
                  <input type="tel" name="patPhone" defaultValue={editApt.patient.phone} className="form-input text-sm" dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <label className="form-label">{ar ? "تاريخ الميلاد" : "Date of birth"}</label>
                  <input type="date" name="patDob" className="form-input text-sm [color-scheme:dark]" dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <label className="form-label">{ar ? "الجنس" : "Gender"}</label>
                  <select name="patGender" className="form-input text-sm">
                    <option value="">{ar ? "—" : "—"}</option>
                    <option value="male">{ar ? "ذكر" : "Male"}</option>
                    <option value="female">{ar ? "أنثى" : "Female"}</option>
                    <option value="unknown">{ar ? "غير محدد" : "Unknown"}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="form-label">{ar ? "فصيلة الدم" : "Blood type"}</label>
                  <select name="patBlood" className="form-input text-sm">
                    <option value="">{ar ? "—" : "—"}</option>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditApt(null)} className="flex-1 rounded-xl border border-white/8 bg-white/4 py-2 text-sm text-slate-400 hover:bg-white/8 transition-colors">{ar ? "إلغاء" : "Cancel"}</button>
                <Button type="submit" className="flex-1" loading={loading}>{ar ? "حفظ" : "Save"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete appointment confirm */}
      {deleteAptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setDeleteAptId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/8 bg-[#0f1629] shadow-2xl p-6 animate-fade-up text-center space-y-4">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/25">
              <Trash2 className="h-7 w-7 text-rose-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{ar ? "حذف الموعد" : "Delete Appointment"}</h3>
              <p className="text-sm text-white/40 mt-1">{ar ? "هل أنت متأكد من حذف هذا الموعد؟" : "Are you sure you want to delete this appointment?"}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteAptId(null)} className="flex-1 rounded-xl border border-white/8 bg-white/4 py-2.5 text-sm text-slate-400 hover:bg-white/8 transition-colors">{ar ? "إلغاء" : "Cancel"}</button>
              <button onClick={async () => {
                setLoading(true);
                await secretaryDeleteAppointment(deleteAptId!, doctorId, secretaryUserId ?? "");
                setDeleteAptId(null); setLoading(false); router.refresh();
              }} disabled={loading}
                className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 py-2.5 text-sm text-white font-medium transition-colors disabled:opacity-50">
                {loading ? "..." : (ar ? "حذف" : "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <Modal isOpen={bookingOpen} onClose={() => setBookingOpen(false)}
        title={ar ? "حجز موعد جديد" : "New Appointment Booking"} size="lg"
        footer={<>
          <Button variant="secondary" onClick={() => setBookingOpen(false)} disabled={loading}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="book-form" loading={loading}>{ar ? "تأكيد الحجز" : "Confirm Booking"}</Button>
        </>}>
        <form id="book-form" onSubmit={handleBook} className="space-y-4">
          <div className="rounded-xl bg-indigo-500/8 border border-indigo-500/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">{ar ? "بيانات المريض" : "Patient Info"}</p>
            <div className="grid grid-cols-2 gap-3">
              <Input name="patientName" label={ar ? "اسم المريض" : "Patient Name"} required placeholder="محمد الأحمدي" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input name="patientPhone" type="tel" label={ar ? "الجوال" : "Phone"} required placeholder="+966 5x xxx xxxx" />
              <Select name="patientGender" label={ar ? "الجنس" : "Gender"} options={genderOpts} placeholder={ar ? "اختر" : "Select"} required />
            </div>
            <p className="text-xs text-slate-500">
              {ar ? "⚡ سيتم إنشاء ملف مريض جديد تلقائياً إذا لم يكن موجوداً" : "⚡ Patient record auto-created if not found"}
            </p>
          </div>
          <div className="rounded-xl bg-slate-800/40 border border-[#2a3347] p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{ar ? "تفاصيل الموعد" : "Appointment Details"}</p>
            <div className="grid grid-cols-2 gap-3">
              <Input name="date" type="date" label={ar ? "التاريخ" : "Date"} required
                defaultValue={new Date().toISOString().split("T")[0]} />
              <Input name="time" type="time" label={ar ? "الوقت" : "Time"} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select name="type" label={ar ? "نوع الزيارة" : "Type"} options={typeOpts} defaultValue="consultation" />
              <Input name="notes" label={ar ? "ملاحظات" : "Notes"} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
