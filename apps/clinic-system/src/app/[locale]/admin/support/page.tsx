import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getAdminInbox, getUnreadCount, getAllSupportConversations, getSystemNotificationStats } from "@/app/actions/messages";
import { getDoctorsWithAccounts } from "@/app/actions/admin";
import AdminSupportClient from "./AdminSupportClient";

export default async function AdminSupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireAuth(locale);
  if (session.role !== "admin") redirect(`/${locale}/doctor`);

  const [conversations, messages, unreadCount, doctors, notifHistory] = await Promise.all([
    getAllSupportConversations(session.userId),
    getAdminInbox(session.userId),
    getUnreadCount(session.userId),
    getDoctorsWithAccounts(),
    getSystemNotificationStats(),
  ]);

  const doctorsForMsg = doctors.map(d => ({ id: d.id, nameAr: d.nameAr, name: d.name, user: d.user }));

  return (
    <DashboardLayout
      locale={locale}
      userName={session.name}
      role="admin"
      userId={session.userId}
      messages={messages as any}
      unreadCount={unreadCount}
      doctors={doctorsForMsg as any}
      adminUserId={session.userId}
      supportUnread={unreadCount}
    >
      <AdminSupportClient
        adminUserId={session.userId}
        conversations={conversations as any}
        doctors={doctorsForMsg}
        notifHistory={notifHistory as any}
        locale={locale}
      />
    </DashboardLayout>
  );
}
