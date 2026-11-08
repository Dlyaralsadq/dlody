import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { prisma } from "@/lib/prisma";
import { getAdminInbox, getUnreadCount } from "@/app/actions/messages";
import { getDoctorsWithAccounts } from "@/app/actions/admin";
import AdminAccountClient from "./AdminAccountClient";

export default async function AdminAccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireAuth(locale);
  if (session.role !== "admin") redirect(`/${locale}/doctor`);

  const [user, messages, unreadCount, doctors] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, username: true },
    }),
    getAdminInbox(session.userId),
    getUnreadCount(session.userId),
    getDoctorsWithAccounts(),
  ]);
  if (!user) redirect(`/${locale}/login`);

  const doctorsForMsg = doctors.map((d) => ({ id: d.id, nameAr: d.nameAr, name: d.name, user: d.user }));

  return (
    <DashboardLayout
      locale={locale}
      userName={session.name}
      role="admin"
      userId={session.userId}
      messages={messages as never}
      unreadCount={unreadCount}
      doctors={doctorsForMsg as never}
      supportUnread={unreadCount}
    >
      <AdminAccountClient locale={locale} name={user.name} username={user.username} />
    </DashboardLayout>
  );
}
