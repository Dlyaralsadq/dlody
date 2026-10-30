import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getAdminStats, getDoctorsWithAccounts } from "@/app/actions/admin";
import { getAdminInbox, getUnreadCount } from "@/app/actions/messages";
import { getDoctorSubscriptions } from "@/app/actions/subscription";
import { getSpecialties } from "@/app/actions/doctors";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireAuth(locale);

  if (session.role !== "admin") redirect(`/${locale}/doctor`);

  const [stats, doctors, specialties, messages, unreadCount, subscriptions] = await Promise.all([
    getAdminStats(),
    getDoctorsWithAccounts(),
    getSpecialties(),
    getAdminInbox(session.userId),
    getUnreadCount(session.userId),
    getDoctorSubscriptions(),
  ]);

  // Get all doctors for messaging (to send messages to them)
  const doctorsForMsg = doctors.map(d => ({ id: d.id, nameAr: d.nameAr, name: d.name, user: d.user }));

  return (
    <DashboardLayout locale={locale} userName={session.name} role="admin"
      userId={session.userId} messages={messages as any} unreadCount={unreadCount}
      doctors={doctorsForMsg as any}>
      <AdminDashboardClient
        stats={stats}
        doctors={doctors}
        specialties={specialties}
        subscriptions={subscriptions}
        locale={locale}
      />
    </DashboardLayout>
  );
}
