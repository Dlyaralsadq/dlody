import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getAppointments } from "@/app/actions/appointments";
import { getPatients } from "@/app/actions/patients";
import { getDoctors } from "@/app/actions/doctors";
import AppointmentsClient from "./AppointmentsClient";

export default async function AppointmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ search?: string; status?: string; date?: string }>;
}) {
  const { locale } = await params;
  const { search, status, date } = await searchParams;
  const session = await requireAuth(locale);

  const [appointments, patients, doctors] = await Promise.all([
    getAppointments({ search, status, date }),
    getPatients(),
    getDoctors(),
  ]);

  return (
    <DashboardLayout locale={locale} userName={session.name}>
      <AppointmentsClient
        appointments={appointments}
        patients={patients}
        doctors={doctors}
        locale={locale}
      />
    </DashboardLayout>
  );
}
