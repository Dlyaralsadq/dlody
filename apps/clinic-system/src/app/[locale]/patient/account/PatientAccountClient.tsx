"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar, Clock, MapPin, Phone, XCircle,
  Stethoscope, User, ShieldCheck, Palette, LogOut,
  CheckCircle2, ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";

import { cancelPatientAppointment } from "@/app/actions/patientAuth";
import { logoutAction } from "@/app/actions/auth";
import PatientProfileForm from "./PatientProfileForm";
import ContactVerifyPanel from "@/components/ui/ContactVerifyPanel";
import ThemeToggle from "@/components/ui/ThemeToggle";

/* ─── types ─── */
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

interface Profile {
  name: string;
  gender: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  phone: string;
  avatarUrl: string | null;
  nationalId: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  username?: string | null;
  email?: string | null;
}

/* ─── component ─── */
export default function PatientAccountClient({
  locale,
  userId,
  profile,
  appointments: initial,
  contactStatus,
  emailVerified,
}: {
  locale: string;
  userId: string;
  profile: Profile;
  appointments: Apt[];
  contactStatus: { email?: string | null; phone?: string | null; emailVerified: boolean; phoneVerified: boolean } | null;
  emailVerified: boolean;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [tab, setTab] = useState<"appts" | "info" | "settings">("appts");
  const [appointments, setAppointments] = useState(initial);
  const [cancelling, setCancelling] = useState<string | null>(null);

  /* ── helpers ── */
  const username = profile.username;
  const displayHandle =
    username && !username.startsWith("pending_") && !/^\d{7,}$/.test(username)
      ? `@${username}`
      : profile.email ?? "";

  const upcoming = appointments.filter(
    (a) => a.status !== "cancelled" && a.status !== "completed" && new Date(a.date) >= new Date()
  );
  const past = appointments.filter((a) => !upcoming.includes(a));

  const statusMeta = (s: string) => ({
    scheduled: { label: ar ? "مجدول" : "Scheduled", cls: "bg-sky-500/15 text-sky-400" },
    confirmed: { label: ar ? "مؤكد" : "Confirmed", cls: "bg-emerald-500/15 text-emerald-400" },
    completed: { label: ar ? "مكتمل" : "Completed", cls: "bg-white/8 text-white/40" },
    cancelled: { label: ar ? "ملغي" : "Cancelled", cls: "bg-rose-500/15 text-rose-400" },
  }[s] ?? { label: s, cls: "bg-white/8 text-white/40" });

  async function handleCancel(id: string) {
    setCancelling(id);
    const r = await cancelPatientAppointment(id, profile.phone);
    if (r.success) setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));
    setCancelling(null);
  }

  async function handleLogout() {
    await logoutAction();
    router.push(`/${locale}/patient`);
    router.refresh();
  }

  /* ── tab config ── */
  const tabs = [
    { id: "appts" as const, icon: Calendar, label: ar ? "مواعيدي" : "Appointments", badge: upcoming.length || undefined },
    { id: "info"  as const, icon: User,     label: ar ? "بياناتي"  : "My info" },
    { id: "settings" as const, icon: ShieldCheck, label: ar ? "الإعدادات" : "Settings" },
  ];

  /* ── avatar ── */
  const initials = (profile.name[0] ?? "P").toUpperCase();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-root)" }} dir={ar ? "rtl" : "ltr"}>

      {/* ══ HERO ══ */}
      <div className="px-4 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-4">
          {/* avatar */}
          <div className="relative shrink-0">
            <div className="h-16 w-16 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center text-xl font-black text-white">
              {profile.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                : initials}
            </div>
            {emailVerified && (
              <span className="absolute -bottom-1 -end-1 rounded-full p-0.5 bg-emerald-500">
                <CheckCircle2 size={10} className="text-white" />
              </span>
            )}
          </div>

          {/* name + handle */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base truncate" style={{ color: "var(--text-1)" }}>{profile.name}</p>
            {displayHandle && (
              <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-3)" }} dir="ltr">{displayHandle}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">
                {ar ? "مريض" : "Patient"}
              </span>
              {upcoming.length > 0 && (
                <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                  {upcoming.length} {ar ? "موعد قادم" : "upcoming"}
                </span>
              )}
            </div>
          </div>

          {/* logout */}
          <button
            onClick={handleLogout}
            className="shrink-0 p-2 rounded-xl transition"
            style={{ color: "var(--text-3)", border: "1px solid var(--border)" }}
            title={ar ? "تسجيل الخروج" : "Sign out"}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ══ TABS ══ */}
      <div
        className="flex sticky top-0 z-10 px-4 gap-1"
        style={{ background: "var(--bg-root)", borderBottom: "1px solid var(--border)" }}
      >
        {tabs.map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-3 py-3 text-xs font-semibold relative transition-colors"
            style={{ color: tab === id ? "var(--text-1)" : "var(--text-3)" }}
          >
            <Icon size={14} />
            {label}
            {badge ? (
              <span className="rounded-full bg-indigo-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center">
                {badge}
              </span>
            ) : null}
            {tab === id && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 rounded-full bg-indigo-500" />
            )}
          </button>
        ))}
      </div>

      {/* ══ CONTENT ══ */}
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* ─ TAB: مواعيدي ─ */}
        {tab === "appts" && (
          <>
            {/* find a doctor CTA */}
            <Link
              href={`/${locale}/patient`}
              className="flex items-center justify-between gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#4f46e5,#0891b2)" }}
            >
              <span>{ar ? "ابحث عن طبيب واحجز موعداً" : "Find a doctor & book"}</span>
              <ChevronRight size={16} className={ar ? "rotate-180" : ""} />
            </Link>

            {/* upcoming */}
            <Section
              icon={<Calendar size={15} className="text-indigo-400" />}
              title={ar ? "المواعيد القادمة" : "Upcoming"}
            >
              {upcoming.length === 0 ? (
                <EmptyState text={ar ? "لا توجد مواعيد قادمة" : "No upcoming appointments"} />
              ) : upcoming.map((apt) => {
                const st = statusMeta(apt.status);
                const d = new Date(apt.date);
                return (
                  <div key={apt.id} className="rounded-2xl p-4 space-y-3" style={{ border: "1px solid var(--border)", background: "var(--bg-card-raised)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate" style={{ color: "var(--text-1)" }}>
                          {ar ? apt.doctor.nameAr : apt.doctor.name}
                        </p>
                        <p className="text-xs text-indigo-400 mt-0.5">
                          {ar ? apt.doctor.specialty.nameAr : apt.doctor.specialty.name}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <InfoRow icon={<Clock size={11} />}>
                        {format(d, "EEEE d MMM yyyy — HH:mm", ar ? { locale: arLocale } : undefined)}
                      </InfoRow>
                      {apt.doctor.clinicAddress && (
                        <InfoRow icon={<MapPin size={11} />}>{apt.doctor.clinicAddress}</InfoRow>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                      {apt.doctor.phone && (
                        <a href={`tel:${apt.doctor.phone}`} className="flex items-center gap-1.5 text-xs font-medium text-cyan-400">
                          <Phone size={12} />
                          {ar ? "اتصل" : "Call"}
                        </a>
                      )}
                      <Link href={`/${locale}/patient/doctor/${apt.doctor.id}`} className="flex items-center gap-1.5 text-xs font-medium text-indigo-400">
                        <Stethoscope size={12} />
                        {ar ? "ملف الطبيب" : "Doctor"}
                      </Link>
                      <button
                        onClick={() => handleCancel(apt.id)}
                        disabled={cancelling === apt.id}
                        className="ms-auto flex items-center gap-1.5 text-xs font-medium text-rose-400 disabled:opacity-40"
                      >
                        <XCircle size={12} />
                        {ar ? "إلغاء" : "Cancel"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </Section>

            {/* past */}
            {past.length > 0 && (
              <Section
                icon={<Stethoscope size={15} className="text-white/30" />}
                title={ar ? "السجل السابق" : "History"}
                muted
              >
                {past.slice(0, 15).map((apt) => {
                  const st = statusMeta(apt.status);
                  return (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                      style={{ border: "1px solid var(--border)" }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-2)" }}>
                          {ar ? apt.doctor.nameAr : apt.doctor.name}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
                          {format(new Date(apt.date), "d MMM yyyy")}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </Section>
            )}
          </>
        )}

        {/* ─ TAB: بياناتي ─ */}
        {tab === "info" && (
          <PatientProfileForm locale={locale} userId={userId} initial={profile} />
        )}

        {/* ─ TAB: الإعدادات ─ */}
        {tab === "settings" && (
          <>
            {/* verification */}
            <Section
              icon={<ShieldCheck size={15} className="text-emerald-400" />}
              title={ar ? "تأكيد الهوية" : "Verification"}
            >
              <ContactVerifyPanel
                locale={locale}
                initialEmail={contactStatus?.email}
                initialPhone={contactStatus?.phone}
                emailVerified={contactStatus?.emailVerified ?? false}
                phoneVerified={contactStatus?.phoneVerified ?? false}
              />
            </Section>

            {/* appearance */}
            <Section
              icon={<Palette size={15} className="text-amber-400" />}
              title={ar ? "المظهر" : "Appearance"}
            >
              <ThemeToggle locale={locale} />
            </Section>

            {/* logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-rose-400 transition"
              style={{ border: "1px solid var(--border)" }}
            >
              <LogOut size={15} />
              {ar ? "تسجيل الخروج" : "Sign out"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── helpers ── */
function Section({
  icon,
  title,
  children,
  muted,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold" style={{ color: muted ? "var(--text-3)" : "var(--text-1)" }}>
          {title}
        </h2>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-xs" style={{ color: "var(--text-3)" }}>
      <span className="mt-px shrink-0 opacity-70">{icon}</span>
      <span>{children}</span>
    </p>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-10 rounded-2xl"
      style={{ border: "1px dashed var(--border)" }}
    >
      <Calendar size={24} style={{ color: "var(--text-3)", opacity: 0.4 }} />
      <p className="text-sm" style={{ color: "var(--text-3)" }}>{text}</p>
    </div>
  );
}
