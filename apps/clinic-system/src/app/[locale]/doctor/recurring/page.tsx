import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getDoctorByUserId, getDoctorTreatmentTypes } from "@/app/actions/doctorPortal";
import { getAdminUserId, getUnreadCount } from "@/app/actions/messages";
import { hasActiveSubscription } from "@/lib/publicDoctors";
import { prisma } from "@/lib/prisma";
import RecurringPatientsClient from "./RecurringPatientsClient";
import TreatmentTypesManager from "./TreatmentTypesManager";
import { getSpecialtyConfig } from "@/lib/specialtyConfig";
import { mergeTreatmentTypes } from "@/lib/treatmentTypes";

export default async function RecurringPatientsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireAuth(locale);

  if (session.role !== "doctor") redirect(`/${locale}/admin`);

  const doctor = await getDoctorByUserId(session.userId);
  if (!doctor) redirect(`/${locale}/login`);

  const subscribed = await hasActiveSubscription(doctor.id);
  if (!subscribed) redirect(`/${locale}/subscribe`);

  if (doctor.recurringPatientsEnabled === false) {
    redirect(`/${locale}/doctor`);
  }

  const specialtyConfig = getSpecialtyConfig(doctor.specialty.name, (doctor.specialty as any).config);
  const defaultTypes = specialtyConfig.recurringTreatmentTypes ?? [
    { value: "recurring", labelAr: "علاج متكرر", labelEn: "Recurring Treatment" },
    { value: "followup", labelAr: "متابعة دورية", labelEn: "Periodic Follow-up" },
  ];
  const [customTypes, adminUserId, unreadCount] = await Promise.all([
    getDoctorTreatmentTypes(doctor.id),
    getAdminUserId(),
    getUnreadCount(session.userId),
  ]);
  const treatmentTypes = mergeTreatmentTypes(defaultTypes, customTypes);

  const recurringPatients = await prisma.patient.findMany({
    where: { doctorId: doctor.id, isRecurring: true },
    include: { _count: { select: { appointments: true } } },
    orderBy: { nextVisitDate: "asc" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <DashboardLayout locale={locale} userName={session.name} role="doctor" doctorSpecialty={doctor.specialty.name} doctorLogoUrl={doctor.logoUrl} recurringPatientsEnabled={true} userId={session.userId} adminUserId={adminUserId ?? undefined} unreadCount={unreadCount}>
      <TreatmentTypesManager doctorId={doctor.id} locale={locale} initialTypes={customTypes} />
      <RecurringPatientsClient
        patients={recurringPatients as any}
        doctorId={doctor.id}
        locale={locale}
        today={today.toISOString()}
        treatmentTypes={treatmentTypes}
      />
    </DashboardLayout>
  );
}
