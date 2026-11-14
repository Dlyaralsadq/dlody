import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getPatients } from "@/app/actions/patients";
import PatientsClient from "./PatientsClient";

export default async function PatientsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ search?: string }>;
}) {
  const { locale } = await params;
  const { search } = await searchParams;
  const session = await requireAuth(locale);

  const patients = await getPatients(search);

  const t = await getTranslations({ locale, namespace: "patients" });

  return (
    <DashboardLayout locale={locale} userName={session.name}>
      <PatientsClient patients={patients} locale={locale} initialSearch={search ?? ""} />
    </DashboardLayout>
  );
}
