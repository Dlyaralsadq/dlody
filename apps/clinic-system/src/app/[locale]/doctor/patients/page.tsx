import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getDoctorByUserId, getDoctorPatients } from "@/app/actions/doctorPortal";
import DoctorPatientsClient from "./DoctorPatientsClient";

export default async function DoctorPatientsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ search?: string }>;
}) {
  const { locale } = await params;
  const { search } = await searchParams;
  const session = await requireAuth(locale);

  if (session.role !== "doctor") redirect(`/${locale}/admin`);

  const doctor = await getDoctorByUserId(session.userId);
  if (!doctor) redirect(`/${locale}/login`);

  const patients = await getDoctorPatients(doctor.id, search);

  return (
    <DashboardLayout locale={locale} userName={session.name} role="doctor" doctorSpecialty={doctor?.specialty?.name ?? doctor?.specialty?.nameAr ?? undefined}>
      <DoctorPatientsClient patients={patients} doctorId={doctor.id} locale={locale} showRecurring={true} doctorSpecialty={doctor.specialty.name} />
    </DashboardLayout>
  );
}
