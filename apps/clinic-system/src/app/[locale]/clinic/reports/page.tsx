import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ReminderPanel from "@/components/clinic/ReminderPanel";
import { clinicDoctorIdForSession } from "@/lib/clinicAccess";
import { hasActiveSubscription } from "@/lib/publicDoctors";
import { getClinicReport, getTomorrowReminders } from "@/app/actions/clinicInsights";
import { prisma } from "@/lib/prisma";

export default async function ClinicReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const ar = locale === "ar";
  const session = await requireAuth(locale);
  const doctorId = await clinicDoctorIdForSession();
  if (!doctorId || (session.role !== "doctor" && session.role !== "secretary")) {
    redirect(`/${locale}/login`);
  }
  if (!(await hasActiveSubscription(doctorId))) redirect(`/${locale}/subscribe`);

  const [report, reminders, doctor] = await Promise.all([
    getClinicReport(doctorId),
    getTomorrowReminders(doctorId, locale),
    prisma.doctor.findUnique({ where: { id: doctorId }, include: { specialty: true } }),
  ]);
  if (!report) redirect(`/${locale}/login`);

  const cards = [
    { label: ar ? "مواعيد الشهر" : "Visits this month", value: String(report.visits) },
    { label: ar ? "زيارات مكتملة" : "Completed", value: String(report.completed) },
    { label: ar ? "إلغاء أو غياب" : "Cancelled or no-show", value: String(report.cancelled) },
    { label: ar ? "مرضى جدد" : "New patients", value: String(report.newPatients) },
    {
      label: ar ? "الإيرادات المحصّلة" : "Collected revenue",
      value: `${Math.round(report.revenue).toLocaleString("en-US")} ${ar ? "د.ع" : "IQD"}`,
    },
  ];

  return (
    <DashboardLayout
      locale={locale}
      userName={session.name}
      role={session.role}
      doctorSpecialty={doctor?.specialty.name}
      doctorLogoUrl={doctor?.logoUrl}
    >
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>
            {ar ? "التقارير والإيرادات" : "Reports and revenue"}
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
            {ar ? "أرقام هذا الشهر. الإيراد يُحسب من المواعيد المدفوعة بسعر الكشفية." : "This month. Revenue uses the fee recorded on paid visits."}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-white/8 p-4" style={{ background: "var(--bg-surface)" }}>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>{card.label}</p>
              <p className="text-2xl font-black mt-1" style={{ color: "var(--text-1)" }}>{card.value}</p>
            </div>
          ))}
        </div>
        <section className="rounded-2xl border border-white/8 p-4" style={{ background: "var(--bg-surface)" }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text-1)" }}>
            {ar ? "أكثر التشخيصات هذا الشهر" : "Top diagnoses this month"}
          </h2>
          {report.topDiagnoses.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-3)" }}>{ar ? "لا تشخيصات مسجّلة بعد" : "No diagnoses recorded yet"}</p>
          ) : (
            <ul className="space-y-2">
              {report.topDiagnoses.map((row) => (
                <li key={row.title} className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text-1)" }}>{row.title}</span>
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <ReminderPanel doctorId={doctorId} locale={locale} items={reminders} />
      </div>
    </DashboardLayout>
  );
}
