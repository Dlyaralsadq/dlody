"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar, Clock, MapPin, Phone, XCircle,
  Stethoscope, User, ShieldCheck, Palette, LogOut,
  CheckCircle2, ChevronRight, Search,
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
    confirmed:  { label: ar ? "مؤكد"   : "Confirmed", cls: "bg-emerald-500/15 text-emerald-400" },
    completed:  { label: ar ? "مكتمل"  : "Completed", cls: "bg-white/8 text-white/40" },
    cancelled:  { label: ar ? "ملغي"   : "Cancelled", cls: "bg-rose-500/15 text-rose-400" },
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

  const initials = (profile.name[0] ?? "P").toUpperCase();

  /* ── bottom-nav config ── */
  const navItems = [
    {
      id: "appts" as const,
      icon: Calendar,
      label: ar ? "مواعيدي" : "Appointments",
      badge: upcoming.length || undefined,
    },
    {
      id: "info" as const,
      icon: User,
      label: ar ? "بياناتي" : "My info",
    },
    {
      id: "settings" as const,
      icon: ShieldCheck,
      label: ar ? "الإعدادات" : "Settings",
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-root)" }}
      dir={ar ? "rtl" : "ltr"}
    >
      {/* ══ HERO HEADER ══ */}
      <div
        className="px-5 pt-6 pb-5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-[60px] w-[60px] rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center text-2xl font-black text-white">
              {profile.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                : initials}
            </div>
            {emailVerified && (
              <span className="absolute -bottom-1 -end-1 rounded-full p-[3px] bg-emerald-500 ring-2 ring-[var(--bg-root)]">
                <CheckCircle2 size={9} className="text-white" />
              </span>
            )}
          </div>

          {/* Name + handle */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[17px] leading-tight truncate"
              style={{ color: "var(--text-1)" }}>
              {profile.name}
            </p>
            {displayHandle && (
              <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-3)" }} dir="ltr">
                {displayHandle}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">
                {ar ? "مريض" : "Patient"}
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                {appointments.length > 0
                  ? `${appointments.length} ${ar ? "موعد" : "appointments"}`
                  : ar ? "لا توجد مواعيد" : "No appointments"}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="shrink-0 p-2.5 rounded-xl transition-opacity hover:opacity-70"
            style={{ color: "var(--text-3)", border: "1px solid var(--border)" }}
            title={ar ? "تسجيل الخروج" : "Sign out"}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ══ SCROLL CONTENT ══ */}
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

          {/* ─ TAB: مواعيدي ─ */}
          {tab === "appts" && (
            <>
              {/* CTA */}
              <Link
                href={`/${locale}/patient`}
                className="flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-white"
                style={{ background: "linear-gradient(135deg,#4f46e5 0%,#0891b2 100%)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/15">
                    <Search size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{ar ? "ابحث عن طبيب" : "Find a doctor"}</p>
                    <p className="text-xs text-white/70 mt-0.5">{ar ? "احجز موعداً بسهولة" : "Book instantly"}</p>
                  </div>
                </div>
                <ChevronRight size={18} className={`opacity-70 ${ar ? "rotate-180" : ""}`} />
              </Link>

              {/* Upcoming */}
              <SectionHeader
                icon={<Calendar size={16} className="text-indigo-400" />}
                title={ar ? "المواعيد القادمة" : "Upcoming appointments"}
                count={upcoming.length}
              />

              {upcoming.length === 0 ? (
                <EmptyState
                  icon={<Calendar size={28} style={{ color: "var(--text-3)", opacity: 0.35 }} />}
                  text={ar ? "لا توجد مواعيد قادمة" : "No upcoming appointments"}
                />
              ) : (
                <div className="space-y-3">
                  {upcoming.map((apt) => {
                    const st = statusMeta(apt.status);
                    const d = new Date(apt.date);
                    return (
                      <div
                        key={apt.id}
                        className="rounded-2xl overflow-hidden"
                        style={{ border: "1px solid var(--border)" }}
                      >
                        {/* Card header */}
                        <div
                          className="px-4 pt-4 pb-3 flex items-start gap-3"
                          style={{ background: "var(--bg-card-raised)" }}
                        >
                          {/* Doctor avatar initial */}
                          <div className="shrink-0 h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400">
                            {(ar ? apt.doctor.nameAr : apt.doctor.name)[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate" style={{ color: "var(--text-1)" }}>
                              {ar ? apt.doctor.nameAr : apt.doctor.name}
                            </p>
                            <p className="text-xs text-indigo-400 mt-0.5">
                              {ar ? apt.doctor.specialty.nameAr : apt.doctor.specialty.name}
                            </p>
                          </div>
                          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${st.cls}`}>
                            {st.label}
                          </span>
                        </div>

                        {/* Card body */}
                        <div className="px-4 py-3 space-y-2">
                          <InfoRow icon={<Clock size={12} />}>
                            {format(d, "EEEE d MMM yyyy — HH:mm", ar ? { locale: arLocale } : undefined)}
                          </InfoRow>
                          {apt.doctor.clinicAddress && (
                            <InfoRow icon={<MapPin size={12} />}>{apt.doctor.clinicAddress}</InfoRow>
                          )}
                        </div>

                        {/* Card footer */}
                        <div
                          className="flex items-center gap-4 px-4 py-3"
                          style={{ borderTop: "1px solid var(--border)" }}
                        >
                          {apt.doctor.phone && (
                            <a href={`tel:${apt.doctor.phone}`}
                              className="flex items-center gap-1.5 text-xs font-medium text-cyan-400">
                              <Phone size={13} />
                              {ar ? "اتصل" : "Call"}
                            </a>
                          )}
                          <Link
                            href={`/${locale}/patient/doctor/${apt.doctor.id}`}
                            className="flex items-center gap-1.5 text-xs font-medium text-indigo-400">
                            <Stethoscope size={13} />
                            {ar ? "ملف الطبيب" : "Doctor"}
                          </Link>
                          <button
                            onClick={() => handleCancel(apt.id)}
                            disabled={cancelling === apt.id}
                            className="ms-auto flex items-center gap-1.5 text-xs font-medium text-rose-400 disabled:opacity-40"
                          >
                            <XCircle size={13} />
                            {ar ? "إلغاء" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Past */}
              {past.length > 0 && (
                <>
                  <SectionHeader
                    icon={<Stethoscope size={16} style={{ color: "var(--text-3)" }} />}
                    title={ar ? "السجل السابق" : "Past appointments"}
                    muted
                  />
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    {past.slice(0, 15).map((apt) => {
                      const st = statusMeta(apt.status);
                      return (
                        <div key={apt.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--text-2)" }}>
                              {ar ? apt.doctor.nameAr : apt.doctor.name}
                            </p>
                            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
                              {format(new Date(apt.date), "d MMM yyyy")}
                            </p>
                          </div>
                          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${st.cls}`}>
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
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
              <SettingsCard
                icon={<ShieldCheck size={18} className="text-emerald-400" />}
                title={ar ? "تأكيد الهوية" : "Verification"}
                subtitle={ar ? "تأكيد البريد ورقم الهاتف" : "Confirm email & phone"}
              >
                <ContactVerifyPanel
                  locale={locale}
                  initialEmail={contactStatus?.email}
                  initialPhone={contactStatus?.phone}
                  emailVerified={contactStatus?.emailVerified ?? false}
                  phoneVerified={contactStatus?.phoneVerified ?? false}
                />
              </SettingsCard>

              <SettingsCard
                icon={<Palette size={18} className="text-amber-400" />}
                title={ar ? "المظهر" : "Appearance"}
                subtitle={ar ? "داكن أو فاتح" : "Dark or light theme"}
              >
                <ThemeToggle locale={locale} />
              </SettingsCard>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-semibold text-rose-400 transition-opacity hover:opacity-70"
                style={{ border: "1px solid rgba(239,68,68,.2)", background: "rgba(239,68,68,.06)" }}
              >
                <LogOut size={16} />
                {ar ? "تسجيل الخروج" : "Sign out"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ══ BOTTOM NAV ══ */}
      <nav
        className="fixed bottom-0 inset-x-0 z-20 flex items-stretch"
        style={{
          background: "var(--bg-root)",
          borderTop: "1px solid var(--border)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {navItems.map(({ id, icon: Icon, label, badge }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 transition-colors relative"
              style={{ color: active ? "#818cf8" : "var(--text-3)" }}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                {badge ? (
                  <span className="absolute -top-1.5 -end-1.5 rounded-full bg-indigo-500 text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center px-1">
                    {badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] font-semibold">{label}</span>
              {active && (
                <span className="absolute top-0 inset-x-6 h-[2px] rounded-b-full bg-indigo-500" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ── sub-components ── */

function SectionHeader({
  icon, title, count, muted,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 pt-1">
      {icon}
      <h2
        className="text-sm font-bold flex-1"
        style={{ color: muted ? "var(--text-3)" : "var(--text-2)" }}
      >
        {title}
      </h2>
      {count != null && count > 0 && (
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">
          {count}
        </span>
      )}
    </div>
  );
}

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-xs" style={{ color: "var(--text-3)" }}>
      <span className="mt-px shrink-0 opacity-60">{icon}</span>
      <span>{children}</span>
    </p>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-14 rounded-2xl"
      style={{ border: "1px dashed var(--border)" }}
    >
      {icon}
      <p className="text-sm" style={{ color: "var(--text-3)" }}>{text}</p>
    </div>
  );
}

function SettingsCard({
  icon, title, subtitle, children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <div
        className="flex items-center gap-3 px-4 py-3.5"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card-raised)" }}
      >
        <div className="p-2 rounded-xl" style={{ background: "var(--bg-root)" }}>{icon}</div>
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{title}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{subtitle}</p>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
