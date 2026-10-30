import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getDoctorByUserId } from "@/app/actions/doctorPortal";
import { getAllAppointmentsForArchive } from "@/app/actions/clinic";
import { formatDate, formatTime } from "@/lib/utils";
import { CheckCheck, FileText, Stethoscope, Pill, Clock, User, Calendar, Archive } from "lucide-react";

export default async function DoctorAppointmentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireAuth(locale);

  if (session.role !== "doctor") redirect(`/${locale}/admin`);

  const doctor = await getDoctorByUserId(session.userId);
  if (!doctor) redirect(`/${locale}/login`);

  const { completed, pending } = await getAllAppointmentsForArchive(doctor.id) as {
    completed: any[]; pending: any[];
  };

  const ar = locale === "ar";

  const typeLabel: Record<string, string> = {
    consultation: ar ? "استشارة" : "Consultation",
    followUp: ar ? "متابعة" : "Follow-up",
    emergency: ar ? "طارئ" : "Emergency",
    procedure: ar ? "إجراء" : "Procedure",
  };

  const AppointmentCard = ({ apt, showComplete }: { apt: any; showComplete: boolean }) => (
    <div className="card p-5 hover:border-[#3d4f70] transition-colors">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-lg border ${
            showComplete
              ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
              : "bg-indigo-500/15 border-indigo-500/25 text-indigo-400"
          }`}>
            {apt.patient.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-white">{apt.patient.name}</h3>
              {apt.queueNumber && (
                <span className="text-xs text-slate-500 font-mono bg-slate-800/60 px-2 py-0.5 rounded">#{apt.queueNumber}</span>
              )}
              <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-xs text-slate-400">
                {typeLabel[apt.type] ?? apt.type}
              </span>
              {apt.isPaid && (
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-xs text-emerald-400">
                  {ar ? "مدفوع" : "Paid"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />{formatDate(apt.date, locale)} · {formatTime(apt.date, locale)}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />{apt.patient.phone}
              </span>
            </div>
          </div>
        </div>
        {showComplete && apt.completedAt && (
          <p className="text-xs text-slate-600 shrink-0">
            {ar ? "أُنجز: " : "Done: "}{formatDate(apt.completedAt, locale)}
          </p>
        )}
      </div>

      {(apt.prescription || apt.notes) && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-[#1e2536] pt-4">
          {apt.prescription && (
            <div className="rounded-xl bg-purple-500/8 border border-purple-500/15 p-3">
              <p className="text-xs font-semibold text-purple-400 mb-1.5 flex items-center gap-1.5">
                <Pill className="h-3 w-3" />{ar ? "الوصفة الطبية" : "Prescription"}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">{apt.prescription}</p>
            </div>
          )}
          {apt.notes && (
            <div className="rounded-xl bg-slate-700/30 border border-[#2a3347] p-3">
              <p className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <FileText className="h-3 w-3" />{ar ? "ملاحظات" : "Notes"}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">{apt.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout locale={locale} userName={session.name} role="doctor"
      doctorSpecialty={doctor.specialty?.name ?? undefined}>
      <div className="space-y-6 animate-fade-in">

        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Archive className="h-5 w-5 text-indigo-400" />
            {ar ? "سجل المواعيد" : "Appointments Archive"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {ar ? `${pending.length} موعد قادم · ${completed.length} موعد مكتمل` : `${pending.length} upcoming · ${completed.length} completed`}
          </p>
        </div>

        {/* ── Upcoming / Pending ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#1e2536]" />
            <h2 className="text-sm font-semibold text-indigo-400 flex items-center gap-2 px-2">
              <Calendar className="h-4 w-4" />
              {ar ? "المواعيد القادمة" : "Upcoming Appointments"}
              <span className="rounded-full bg-indigo-500/15 border border-indigo-500/25 px-2 py-0.5 text-xs">{pending.length}</span>
            </h2>
            <div className="h-px flex-1 bg-[#1e2536]" />
          </div>

          {pending.length === 0 ? (
            <div className="card p-8 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-700" />
              <p className="text-slate-600 text-sm">{ar ? "لا توجد مواعيد قادمة" : "No upcoming appointments"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map(apt => <AppointmentCard key={apt.id} apt={apt} showComplete={false} />)}
            </div>
          )}
        </div>

        {/* ── Completed ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#1e2536]" />
            <h2 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 px-2">
              <CheckCheck className="h-4 w-4" />
              {ar ? "المواعيد المنجزة" : "Completed Appointments"}
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-xs">{completed.length}</span>
            </h2>
            <div className="h-px flex-1 bg-[#1e2536]" />
          </div>

          {completed.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckCheck className="h-8 w-8 mx-auto mb-2 text-slate-700" />
              <p className="text-slate-600 text-sm">{ar ? "لا توجد مواعيد مكتملة بعد" : "No completed appointments yet"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completed.map(apt => <AppointmentCard key={apt.id} apt={apt} showComplete={true} />)}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
