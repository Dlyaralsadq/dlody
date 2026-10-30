import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPatientAppointments, getPatientProfile } from "@/app/actions/patientAuth";
import PatientAccountClient from "./PatientAccountClient";
import PatientProfileForm from "./PatientProfileForm";

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

  const [appointments, profile] = await Promise.all([
    getPatientAppointments(session.username),
    getPatientProfile(session.userId),
  ]);

  return (
    <div className="min-h-screen bg-[#060912]" dir={ar ? "rtl" : "ltr"}>
      <nav className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <Link href={`/${locale}/patient`} className="font-black text-white text-sm">
          ClinicPro
        </Link>
        <Link href={`/${locale}`} className="text-xs text-white/40 hover:text-white/70">
          {ar ? "الرئيسية" : "Home"}
        </Link>
      </nav>
      <div className="p-4 space-y-6">
        <PatientProfileForm
          locale={locale}
          userId={session.userId}
          initial={{
            name: profile?.name ?? session.name,
            gender: profile?.gender ?? null,
            dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : null,
            bloodType: profile?.bloodType ?? null,
            phone: profile?.username ?? session.username,
          }}
        />
        <PatientAccountClient
          locale={locale}
          userName={session.name}
          phone={session.username}
          appointments={appointments as any}
        />
      </div>
    </div>
  );
}
