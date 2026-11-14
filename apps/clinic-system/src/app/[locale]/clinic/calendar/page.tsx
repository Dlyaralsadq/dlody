import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ClinicCalendar from "@/components/clinic/ClinicCalendar";
import { clinicDoctorIdForSession } from "@/lib/clinicAccess";
import { hasActiveSubscription } from "@/lib/publicDoctors";
import { getMonthAppointments } from "@/app/actions/clinicInsights";
import { prisma } from "@/lib/prisma";

export default async function ClinicCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const session = await requireAuth(locale);
  const doctorId = await clinicDoctorIdForSession();
  if (!doctorId || (session.role !== "doctor" && session.role !== "secretary")) {
    redirect(`/${locale}/login`);
  }
  if (!(await hasActiveSubscription(doctorId))) redirect(`/${locale}/subscribe`);

  const now = new Date();
  const year = Number(query.y) || now.getFullYear();
  const month = Number(query.m) || now.getMonth() + 1;
  const [items, doctor] = await Promise.all([
    getMonthAppointments(doctorId, year, month),
    prisma.doctor.findUnique({ where: { id: doctorId }, include: { specialty: true } }),
  ]);

  return (
    <DashboardLayout
      locale={locale}
      userName={session.name}
      role={session.role}
      doctorSpecialty={doctor?.specialty.name}
      doctorLogoUrl={doctor?.logoUrl}
    >
      <ClinicCalendar locale={locale} year={year} month={month} items={items} />
    </DashboardLayout>
  );
}
