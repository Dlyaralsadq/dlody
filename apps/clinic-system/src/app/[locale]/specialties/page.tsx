import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getSpecialties } from "@/app/actions/doctors";
import SpecialtiesClient from "./SpecialtiesClient";

export default async function SpecialtiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireAuth(locale);
  const specialties = await getSpecialties();

  return (
    <DashboardLayout locale={locale} userName={session.name}>
      <SpecialtiesClient specialties={specialties} locale={locale} />
    </DashboardLayout>
  );
}
