import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getDoctorByUserId } from "@/app/actions/doctorPortal";
import { getAllAppointmentsForArchive } from "@/app/actions/clinic";
import { getAdminUserId, getUnreadCount } from "@/app/actions/messages";
import { hasActiveSubscription } from "@/lib/publicDoctors";
import DoctorAppointmentsArchiveClient from "./DoctorAppointmentsArchiveClient";

export default async function DoctorAppointmentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireAuth(locale);

  if (session.role !== "doctor") redirect(`/${locale}/admin`);

  const doctor = await getDoctorByUserId(session.userId);
  if (!doctor) redirect(`/${locale}/login`);

  const subscribed = await hasActiveSubscription(doctor.id);
  if (!subscribed) redirect(`/${locale}/subscribe`);

  const [{ completed, pending }, adminUserId, unreadCount] = await Promise.all([
    getAllAppointmentsForArchive(doctor.id) as Promise<{ completed: any[]; pending: any[] }>,
    getAdminUserId(),
    getUnreadCount(session.userId),
  ]);

  return (
    <DashboardLayout locale={locale} userName={session.name} role="doctor"
      doctorSpecialty={doctor.specialty?.name ?? undefined} doctorLogoUrl={doctor.logoUrl} recurringPatientsEnabled={doctor.recurringPatientsEnabled ?? true} userId={session.userId} adminUserId={adminUserId ?? undefined} unreadCount={unreadCount}>
      <DoctorAppointmentsArchiveClient
        pending={pending}
        completed={completed}
        locale={locale}
        doctorId={doctor.id}
      />
    </DashboardLayout>
  );
}
