import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getDoctors, getSpecialties } from "@/app/actions/doctors";
import DoctorsClient from "./DoctorsClient";

export default async function DoctorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ search?: string; specialty?: string }>;
}) {
  const { locale } = await params;
  const { search, specialty } = await searchParams;
  const session = await requireAuth(locale);

  const [doctors, specialties] = await Promise.all([
    getDoctors(search, specialty),
    getSpecialties(),
  ]);

  return (
    <DashboardLayout locale={locale} userName={session.name}>
      <DoctorsClient
        doctors={doctors}
        specialties={specialties}
        locale={locale}
      />
    </DashboardLayout>
  );
}
