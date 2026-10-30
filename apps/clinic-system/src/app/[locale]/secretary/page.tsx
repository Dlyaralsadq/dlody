import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getAllUpcomingAppointments, getDoctorForDisplay, getTodaySyncedQueue } from "@/app/actions/clinic";
import { getSpecialtyConfig } from "@/lib/specialtyConfig";
import { getDoctorByUserId, getDoctorPatients } from "@/app/actions/doctorPortal";
import SecretaryClient from "./SecretaryClient";
import { prisma } from "@/lib/prisma";

export default async function SecretaryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireAuth(locale);

  let doctorId: string | null = null;
  if (session.role === "secretary") {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    doctorId = user?.linkedDoctorId ?? null;
  } else if (session.role === "doctor") {
    const doctor = await getDoctorByUserId(session.userId);
    doctorId = doctor?.id ?? null;
  } else {
    redirect(`/${locale}/admin`);
  }

  if (!doctorId) redirect(`/${locale}/login`);

  const [appointments, todayQueue, patients] = await Promise.all([
    getAllUpcomingAppointments(doctorId),
    getTodaySyncedQueue(doctorId),
    getDoctorPatients(doctorId),
  ]);

  const doctorDoc = await (await import("@/lib/prisma")).prisma.doctor.findUnique({ where: { id: doctorId! }, include: { specialty: true } });
  const specialtyConfig = doctorDoc ? getSpecialtyConfig(doctorDoc.specialty.name, (doctorDoc.specialty as any).config) : undefined;

  return (
    <DashboardLayout locale={locale} userName={session.name} role={session.role} doctorSpecialty={doctorDoc?.specialty?.name ?? undefined}>
      <SecretaryClient
        appointments={appointments as any}
        todayQueue={todayQueue as any}
        doctor={doctorDoc}
        specialtyConfig={specialtyConfig}
        patients={patients}
        doctorId={doctorId}
        locale={locale}
      />
    </DashboardLayout>
  );
}
