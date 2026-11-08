import { requireAuth, clearSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getDoctorByUserId } from "@/app/actions/doctorPortal";
import { getTodaySyncedQueue, getSecretaryDeletedAppointments } from "@/app/actions/clinic";
import { getMessagesForUser, getUnreadCount, getAdminUserId } from "@/app/actions/messages";
import { getSpecialtyConfig } from "@/lib/specialtyConfig";
import { hasActiveSubscription } from "@/lib/publicDoctors";
import DoctorClinicClient from "./DoctorClinicClient";
import ReminderPanel from "@/components/clinic/ReminderPanel";
import { getTomorrowReminders } from "@/app/actions/clinicInsights";

export default async function DoctorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireAuth(locale);

  if (session.role !== "doctor") redirect(`/${locale}/admin`);

  const doctor = await getDoctorByUserId(session.userId);
  if (!doctor) {
    await clearSession();
    redirect(`/${locale}/login`);
  }

  // Gate full clinic management behind active subscription.
  // Doctor settings (profile/location) are always accessible.
  const subscribed = await hasActiveSubscription(doctor.id);
  if (!subscribed) redirect(`/${locale}/subscribe`);

  const [queue, recurringCount, messages, unreadCount, adminUserId, deletedBySecretary, reminders] = await Promise.all([
    getTodaySyncedQueue(doctor.id),
    (await import("@/lib/prisma")).prisma.patient.count({ where: { doctorId: doctor.id, isRecurring: true } }),
    getMessagesForUser(session.userId),
    getUnreadCount(session.userId),
    getAdminUserId(),
    getSecretaryDeletedAppointments(doctor.id),
    getTomorrowReminders(doctor.id, locale),
  ]);
  const specialtyConfig = getSpecialtyConfig(doctor.specialty.name, (doctor.specialty as any).config);

  return (
    <DashboardLayout locale={locale} userName={session.name} role="doctor" doctorSpecialty={doctor.specialty.name} doctorLogoUrl={doctor.logoUrl} recurringPatientsEnabled={doctor.recurringPatientsEnabled ?? true} recurringCount={doctor.recurringPatientsEnabled !== false ? recurringCount : undefined} userId={session.userId} messages={messages as any} unreadCount={unreadCount} adminUserId={adminUserId ?? undefined}>
      {reminders.length > 0 && (
        <div className="mb-4">
          <ReminderPanel doctorId={doctor.id} locale={locale} items={reminders} />
        </div>
      )}
      <DoctorClinicClient doctor={doctor} queue={queue as any} deletedBySecretary={deletedBySecretary as any} locale={locale} specialtyConfig={specialtyConfig} />
    </DashboardLayout>
  );
}
