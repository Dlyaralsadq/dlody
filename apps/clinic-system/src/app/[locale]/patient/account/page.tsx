import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPatientAppointments, getPatientProfile } from "@/app/actions/patientAuth";
import { getContactVerificationStatus } from "@/app/actions/contactVerification";
import PatientAccountClient from "./PatientAccountClient";

export default async function PatientAccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireAuth(locale);

  if (session.role !== "patient") {
    redirect(`/${locale}/patient/login`);
  }

  const [profile, contactStatus, appointmentsRaw] = await Promise.all([
    getPatientProfile(session.userId),
    getContactVerificationStatus(session.userId),
    (async () => null)(), // placeholder, loaded below
  ]);

  const appointments = profile?.phone
    ? await getPatientAppointments(profile.phone)
    : [];

  return (
    <PatientAccountClient
      locale={locale}
      userId={session.userId}
      emailVerified={contactStatus?.emailVerified ?? false}
      profile={{
        name: profile?.name ?? session.name,
        gender: profile?.gender ?? null,
        dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : null,
        bloodType: profile?.bloodType ?? null,
        phone: profile?.phone ?? "",
        avatarUrl: profile?.avatarUrl ?? null,
        nationalId: profile?.nationalId ?? null,
        emergencyContact: profile?.emergencyContact ?? null,
        emergencyPhone: profile?.emergencyPhone ?? null,
        username: profile?.username ?? null,
        email: profile?.email ?? null,
      }}
      appointments={appointments as any}
      contactStatus={
        contactStatus
          ? {
              email: contactStatus.email,
              phone: contactStatus.phone,
              emailVerified: contactStatus.emailVerified ?? false,
              phoneVerified: contactStatus.phoneVerified ?? false,
            }
          : null
      }
    />
  );
}
