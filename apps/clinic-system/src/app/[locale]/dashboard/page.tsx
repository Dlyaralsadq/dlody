import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireAuth(locale);

  if (session.role === "doctor") {
    redirect(`/${locale}/doctor`);
  } else {
    redirect(`/${locale}/admin`);
  }
}
