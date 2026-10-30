import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getDoctorByUserId, getSecretariesForDoctorPortal } from "@/app/actions/doctorPortal";
import { getMessagesForUser, getUnreadCount, getAdminUserId } from "@/app/actions/messages";
import { hasActiveSubscription } from "@/lib/publicDoctors";
import { prisma } from "@/lib/prisma";
import DoctorSettingsClient from "./DoctorSettingsClient";

export default async function DoctorSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireAuth(locale);
  if (session.role !== "doctor") redirect(`/${locale}/admin`);

  const doctor = await getDoctorByUserId(session.userId);
  if (!doctor) redirect(`/${locale}/login`);

  const subscribed = await hasActiveSubscription(doctor.id);

  const [specialties, messages, unreadCount, adminUserId, secretaries] = await Promise.all([
    prisma.specialty.findMany({ where: { isActive: true }, orderBy: { nameAr: "asc" } }),
    subscribed ? getMessagesForUser(session.userId) : Promise.resolve([]),
    subscribed ? getUnreadCount(session.userId) : Promise.resolve(0),
    subscribed ? getAdminUserId() : Promise.resolve(null),
    getSecretariesForDoctorPortal(doctor.id),
  ]);

  return (
    <DashboardLayout
      locale={locale}
      userName={session.name}
      role="doctor"
      doctorSpecialty={doctor.specialty.name}
      userId={subscribed ? session.userId : undefined}
      messages={messages as any}
      unreadCount={unreadCount}
      adminUserId={adminUserId ?? undefined}
    >
      {!subscribed && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
          <p className="text-sm text-amber-300">
            {locale === "ar"
              ? "أنت على الخطة المجانية — أكمل بياناتك لتظهر للمرضى على الخريطة"
              : "You're on the free plan — complete your profile to appear on the patient map"}
          </p>
        </div>
      )}
      <DoctorSettingsClient
        doctor={doctor as any}
        specialties={specialties}
        locale={locale}
        isSubscribed={subscribed}
        secretaries={secretaries}
      />
    </DashboardLayout>
  );
}
