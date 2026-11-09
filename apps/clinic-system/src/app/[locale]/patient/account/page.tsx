import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPatientAppointments, getPatientProfile } from "@/app/actions/patientAuth";
import { getContactVerificationStatus } from "@/app/actions/contactVerification";
import PatientAccountClient from "./PatientAccountClient";
import PatientProfileForm from "./PatientProfileForm";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ContactVerifyPanel from "@/components/ui/ContactVerifyPanel";
import { Palette, ShieldCheck } from "lucide-react";
import InfoTooltip from "@/components/ui/InfoTooltip";

export default async function PatientAccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const ar = locale === "ar";
  const session = await requireAuth(locale);

  if (session.role !== "patient") {
    redirect(`/${locale}/patient/login`);
  }

  const [profile, contactStatus] = await Promise.all([
    getPatientProfile(session.userId),
    getContactVerificationStatus(session.userId),
  ]);
  const appointments = await getPatientAppointments(profile?.phone ?? "");

  const initial = profile?.name?.[0]?.toUpperCase() ?? "P";

  return (
        <div className="min-h-screen" style={{ background: "var(--bg-root)" }} dir={ar ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-10 px-4 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-root)" }}>
        <h1 className="text-lg font-black" style={{ color: "var(--text-1)" }}>{ar ? "حسابي" : "My Profile"}</h1>
      </header>

      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-4 px-4 py-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-600 to-indigo-600 text-2xl font-black text-white border-2 border-white/10">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div>
            <p className="font-bold text-white text-lg">{profile?.name ?? session.name}</p>
            <p className="text-sm text-white/40 mt-0.5" dir="ltr">
              {profile?.username && !profile.username.startsWith("pending_") && !/^\d{7,}$/.test(profile.username)
                ? `@${profile.username}`
                : (profile?.email ?? "")}
            </p>
            <p className="text-[11px] text-cyan-400/80 mt-1">
              {appointments.length} {ar ? "موعد" : "appointments"}
            </p>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-1)" }}>
              <ShieldCheck size={15} className="text-cyan-400" />
              {ar ? "تأكيد البريد والهاتف" : "Verify email & phone"}
              <InfoTooltip locale={locale} text={ar ? "الدخول بالبريد بعد تأكيد الرمز. رقم الهاتف للتواصل والحجز فقط." : "Sign in with your confirmed email. The phone number is for contact and booking."} />
            </h2>
            <ContactVerifyPanel
              locale={locale}
              initialEmail={contactStatus?.email}
              initialPhone={contactStatus?.phone}
              emailVerified={contactStatus?.emailVerified ?? false}
              phoneVerified={contactStatus?.phoneVerified ?? false}
            />
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-1)" }}>
              <Palette size={15} className="text-cyan-400" />
              {ar ? "المظهر" : "Appearance"}
            </h2>
            <ThemeToggle locale={locale} />
          </section>
          <PatientProfileForm
            locale={locale}
            userId={session.userId}
            initial={{
              name: profile?.name ?? session.name,
              gender: profile?.gender ?? null,
              dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : null,
              bloodType: profile?.bloodType ?? null,
              phone: profile?.phone ?? "",
              avatarUrl: profile?.avatarUrl ?? null,
              nationalId: profile?.nationalId ?? null,
              emergencyContact: profile?.emergencyContact ?? null,
              emergencyPhone: profile?.emergencyPhone ?? null,
            }}
          />
          <PatientAccountClient
            locale={locale}
            userName={session.name}
            phone={profile?.phone ?? ""}
            appointments={appointments as any}
          />
        </div>
      </div>
    </div>
  );
}
