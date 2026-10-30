import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getPatient } from "@/app/actions/patients";
import { notFound } from "next/navigation";
import { calculateAge, formatDate, formatTime, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, Calendar, Mail, Phone, User, Droplets, Shield, Heart } from "lucide-react";
import Badge, { getAppointmentStatusVariant } from "@/components/ui/Badge";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await requireAuth(locale);
  const patient = await getPatient(id);

  if (!patient) notFound();

  const t = await getTranslations({ locale, namespace: "patients" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const ta = await getTranslations({ locale, namespace: "appointments" });

  const appointmentStatusMap: Record<string, string> = {
    scheduled: ta("scheduled"),
    confirmed: ta("confirmed"),
    completed: ta("completed"),
    cancelled: ta("cancelled"),
    noShow: ta("noShow"),
  };

  return (
    <DashboardLayout locale={locale} userName={session.name}>
      <div className="space-y-5 animate-fade-in">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href={`/${locale}/patients`} className="hover:text-blue-600 transition-colors">
            {t("title")}
          </Link>
          <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          <span className="text-gray-900 font-medium">{patient.name}</span>
        </div>

        {/* Patient header card */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white text-2xl font-bold">
              {patient.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">{patient.name}</h1>
                {patient.nameAr && (
                  <span className="text-gray-500">•</span>
                )}
                {patient.nameAr && (
                  <h2 className="text-lg font-semibold text-gray-600">{patient.nameAr}</h2>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {t("patientId")}: <strong className="text-gray-700 font-mono">{patient.patientNumber}</strong>
                </span>
                {patient.dateOfBirth && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {calculateAge(patient.dateOfBirth)} {t("years")}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />
                  {patient.phone}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={patient.gender === "male" ? "info" : "purple"}>
                {patient.gender === "male" ? (locale === "ar" ? "ذكر" : "Male") : (locale === "ar" ? "أنثى" : "Female")}
              </Badge>
              {patient.bloodType && (
                <Badge variant="danger">{patient.bloodType}</Badge>
              )}
              <Badge variant={patient.isActive ? "success" : "default"}>
                {patient.isActive ? tc("active") : tc("inactive")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Personal info */}
          <div className="card p-5 lg:col-span-2">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              {t("patientDetails")}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: t("fullName"), value: patient.name },
                { label: tc("phone"), value: patient.phone },
                { label: tc("email"), value: patient.email },
                { label: t("dateOfBirth"), value: patient.dateOfBirth ? formatDate(patient.dateOfBirth, locale) : null },
                { label: t("nationalId"), value: patient.nationalId },
                { label: t("bloodType"), value: patient.bloodType },
                { label: t("insurance"), value: patient.insurance },
                { label: tc("address"), value: patient.address },
              ].map(({ label, value }) => (
                value ? (
                  <div key={label}>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                  </div>
                ) : null
              ))}
            </div>

            {/* Emergency contact */}
            {(patient.emergencyContact || patient.emergencyPhone) && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-4">
                <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  {t("emergencyContact")}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {patient.emergencyContact && <div><span className="text-gray-500">{locale === "ar" ? "الاسم: " : "Name: "}</span>{patient.emergencyContact}</div>}
                  {patient.emergencyPhone && <div><span className="text-gray-500">{tc("phone")}: </span>{patient.emergencyPhone}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Medical info */}
          <div className="space-y-4">
            {patient.medicalHistory && (
              <div className="card p-5">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-red-500" />
                  {t("medicalHistory")}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">{patient.medicalHistory}</p>
              </div>
            )}

            {patient.allergies && (
              <div className="card p-5">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-500" />
                  {t("allergies")}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">{patient.allergies}</p>
              </div>
            )}

            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-3">{tc("total")}</h2>
              <div className="text-3xl font-bold text-blue-600">{patient.appointments.length}</div>
              <p className="text-sm text-gray-500">{t("appointments")}</p>
            </div>
          </div>
        </div>

        {/* Appointments */}
        <div className="card overflow-hidden">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold text-gray-900">{t("appointments")}</h2>
          </div>
          {patient.appointments.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              {t("noAppointments")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{ta("date")}</th>
                    <th>{ta("doctor")}</th>
                    <th>{ta("type")}</th>
                    <th>{ta("status")}</th>
                    <th>{tc("notes")}</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.appointments.map((apt) => (
                    <tr key={apt.id}>
                      <td>
                        <p className="text-sm font-medium text-gray-800">{formatDate(apt.date, locale)}</p>
                        <p className="text-xs text-gray-400">{formatTime(apt.date, locale)}</p>
                      </td>
                      <td>
                        <p className="font-medium text-gray-800">{locale === "ar" ? apt.doctor.nameAr : apt.doctor.name}</p>
                        <p className="text-xs text-gray-400">{locale === "ar" ? apt.doctor.specialty.nameAr : apt.doctor.specialty.name}</p>
                      </td>
                      <td className="text-gray-600 text-sm">{apt.type}</td>
                      <td>
                        <Badge variant={getAppointmentStatusVariant(apt.status)}>
                          {appointmentStatusMap[apt.status] ?? apt.status}
                        </Badge>
                      </td>
                      <td className="text-sm text-gray-500">{apt.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
