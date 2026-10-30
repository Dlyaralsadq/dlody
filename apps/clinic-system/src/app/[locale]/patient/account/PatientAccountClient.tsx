"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Phone, XCircle, Clock, Stethoscope } from "lucide-react";
import { cancelPatientAppointment } from "@/app/actions/patientAuth";
import { logoutAction } from "@/app/actions/auth";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";

interface Apt {
  id: string;
  appointmentNumber: string;
  date: Date | string;
  status: string;
  reason: string | null;
  doctor: {
    id: string;
    nameAr: string;
    name: string;
    phone: string | null;
    clinicAddress: string | null;
    specialty: { nameAr: string; name: string };
  };
}

export default function PatientAccountClient({
  locale,
  userName,
  phone,
  appointments: initial,
}: {
  locale: string;
  userName: string;
  phone: string;
  appointments: Apt[];
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [appointments, setAppointments] = useState(initial);
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function handleCancel(id: string) {
    setCancelling(id);
    const r = await cancelPatientAppointment(id, phone);
    if (r.success) {
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));
    }
    setCancelling(null);
  }

  async function handleLogout() {
    await logoutAction();
    router.push(`/${locale}/patient`);
    router.refresh();
  }

  const upcoming = appointments.filter((a) => a.status !== "cancelled" && a.status !== "completed" && new Date(a.date) >= new Date());
  const past = appointments.filter((a) => !upcoming.includes(a));

  const statusLabel = (s: string) => {
    const map: Record<string, { ar: string; en: string; cls: string }> = {
      scheduled: { ar: "مجدول", en: "Scheduled", cls: "text-cyan-400" },
      confirmed: { ar: "مؤكد", en: "Confirmed", cls: "text-emerald-400" },
      completed: { ar: "مكتمل", en: "Completed", cls: "text-white/40" },
      cancelled: { ar: "ملغي", en: "Cancelled", cls: "text-rose-400" },
    };
    const m = map[s] ?? map.scheduled;
    return { label: ar ? m.ar : m.en, cls: m.cls };
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">{ar ? `مرحباً، ${userName}` : `Hello, ${userName}`}</h1>
          <p className="text-xs text-white/40 mt-0.5" dir="ltr">{phone}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/50 hover:text-white"
        >
          {ar ? "خروج" : "Logout"}
        </button>
      </div>

      <Link
        href={`/${locale}/patient`}
        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 py-3 text-sm font-bold text-white"
      >
        <MapPin size={16} />
        {ar ? "ابحث عن طبيب واحجز" : "Find a doctor & book"}
      </Link>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Calendar size={15} className="text-cyan-400" />
          {ar ? "مواعيدي القادمة" : "Upcoming appointments"}
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-xs text-white/30 rounded-xl border border-white/8 p-4 text-center">
            {ar ? "لا توجد مواعيد قادمة" : "No upcoming appointments"}
          </p>
        ) : (
          upcoming.map((apt) => {
            const st = statusLabel(apt.status);
            const d = new Date(apt.date);
            return (
              <div key={apt.id} className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-white text-sm">{ar ? apt.doctor.nameAr : apt.doctor.name}</p>
                    <p className="text-xs text-cyan-400">{ar ? apt.doctor.specialty.nameAr : apt.doctor.specialty.name}</p>
                  </div>
                  <span className={`text-[10px] font-semibold ${st.cls}`}>{st.label}</span>
                </div>
                <p className="text-xs text-white/50 flex items-center gap-1.5">
                  <Clock size={12} />
                  {format(d, "EEEE d MMM yyyy — HH:mm", ar ? { locale: arLocale } : undefined)}
                </p>
                {apt.doctor.clinicAddress && (
                  <p className="text-xs text-white/40 flex items-start gap-1.5">
                    <MapPin size={12} className="shrink-0 mt-0.5" />
                    {apt.doctor.clinicAddress}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  {apt.doctor.phone && (
                    <a href={`tel:${apt.doctor.phone}`} className="flex items-center gap-1 text-xs text-cyan-400">
                      <Phone size={12} /> {ar ? "اتصل" : "Call"}
                    </a>
                  )}
                  <Link href={`/${locale}/patient/doctor/${apt.doctor.id}`} className="text-xs text-indigo-400">
                    {ar ? "تفاصيل الطبيب" : "Doctor profile"}
                  </Link>
                  <button
                    onClick={() => handleCancel(apt.id)}
                    disabled={cancelling === apt.id}
                    className="ms-auto flex items-center gap-1 text-xs text-rose-400 disabled:opacity-50"
                  >
                    <XCircle size={12} />
                    {ar ? "إلغاء" : "Cancel"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/60 flex items-center gap-2">
            <Stethoscope size={15} />
            {ar ? "سجل المواعيد" : "Past appointments"}
          </h2>
          {past.slice(0, 10).map((apt) => {
            const st = statusLabel(apt.status);
            return (
              <div key={apt.id} className="rounded-xl border border-white/5 bg-white/2 px-4 py-3 opacity-70">
                <p className="text-xs font-semibold text-white">{ar ? apt.doctor.nameAr : apt.doctor.name}</p>
                <p className="text-[10px] text-white/40">{format(new Date(apt.date), "d MMM yyyy HH:mm")} · <span className={st.cls}>{st.label}</span></p>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
