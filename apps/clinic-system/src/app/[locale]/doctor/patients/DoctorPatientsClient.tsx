"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, User, CreditCard, Eye, Pill, FileText, Calendar, Stethoscope, Loader2, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { createPatientForDoctor, updatePatientForDoctor } from "@/app/actions/doctorPortal";
import { getPatientHistoryForDoctor } from "@/app/actions/clinic";
import PatientChartPanel from "@/components/clinic/PatientChartPanel";
import { formatDate, formatTime, calculateAge } from "@/lib/utils";

interface Patient {
  id: string; patientNumber: string; name: string; nameAr: string | null;
  gender: string; phone: string; dateOfBirth: Date | null; bloodType: string | null;
  medicalHistory: string | null; allergies: string | null;
  nationalId: string | null; insurance: string | null;
  emergencyContact: string | null; emergencyPhone: string | null;
  isActive: boolean; _count: { appointments: number };
}

export default function DoctorPatientsClient({ patients, doctorId, locale, showRecurring, doctorSpecialty }: {
  patients: Patient[]; doctorId: string; locale: string; showRecurring?: boolean; doctorSpecialty?: string;
}) {
  const t = useTranslations("patients");
  const tc = useTranslations("common");
  const dp = useTranslations("doctorPortal");
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  // Patient file / history modal
  type PatientHistory = Awaited<ReturnType<typeof getPatientHistoryForDoctor>>;
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [patientHistory, setPatientHistory] = useState<PatientHistory>(null);

  const openHistory = async (patientId: string) => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setPatientHistory(null);
    try {
      const data = await getPatientHistoryForDoctor(doctorId, patientId);
      setPatientHistory(data);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filtered = search
    ? patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.nameAr?.includes(search) ?? false) ||
        p.phone.includes(search) ||
        (p.nationalId?.includes(search) ?? false)
      )
    : patients;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setErrors({});
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name") as string,
      isRecurring: fd.get("isRecurring") === "on",
      nameAr: fd.get("nameAr") as string || undefined,
      gender: fd.get("gender") as string,
      phone: fd.get("phone") as string,
      email: fd.get("email") as string || undefined,
      dateOfBirth: fd.get("dateOfBirth") as string || undefined,
      bloodType: fd.get("bloodType") as string || undefined,
      nationalId: fd.get("nationalId") as string || undefined,
      insurance: fd.get("insurance") as string || undefined,
      medicalHistory: fd.get("medicalHistory") as string || undefined,
      allergies: fd.get("allergies") as string || undefined,
      emergencyContact: fd.get("emergencyContact") as string || undefined,
      emergencyPhone: fd.get("emergencyPhone") as string || undefined,
    };
    if (!data.name || !data.phone || !data.gender) {
      setErrors({ general: tc("required") }); setLoading(false); return;
    }
    if (!data.nationalId?.trim()) {
      setErrors({ general: locale === "ar" ? "رقم الهوية الوطنية مطلوب" : "National ID is required" });
      setLoading(false); return;
    }
    if (editPatient) {
      await updatePatientForDoctor(editPatient.id, doctorId, data);
    } else {
      await createPatientForDoctor(doctorId, data as Parameters<typeof createPatientForDoctor>[1]);
    }
    setLoading(false); setModalOpen(false); setEditPatient(null);
    router.refresh();
  };

  const genderOptions = [
    { value: "male", label: locale === "ar" ? "ذكر" : "Male" },
    { value: "female", label: locale === "ar" ? "أنثى" : "Female" },
  ];
  const bloodTypeOptions = ["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => ({ value: b, label: b }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dp("myPatients")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t("subtitle")}</p>
        </div>
        <Button onClick={() => { setEditPatient(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" />
          {t("addPatient")}
        </Button>
      </div>

      <div className="card p-4" style={{ background: "rgba(99,102,241,.07)", borderColor: "rgba(99,102,241,.22)" }}>
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 start-0 flex items-center ps-3" style={{ color: "rgba(139,92,246,.7)" }}>
            <Search className="h-4 w-4" />
          </span>
          <input
            value={search}
            dir="auto" onChange={e => setSearch(e.target.value)}
            placeholder={locale === "ar" ? "البحث بالاسم أو الهاتف أو رقم الهوية..." : "Search by name, phone or national ID..."}
            className="form-input ps-9 pe-4 py-2 text-sm w-full"
          />
        </div>
      </div>

      <div className="card overflow-hidden" style={{ background: "linear-gradient(135deg,rgba(99,102,241,.1) 0%,rgba(139,92,246,.06) 100%)", borderColor: "rgba(99,102,241,.28)" }}>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("patientId")}</th>
                <th>{t("fullName")}</th>
                <th>{tc("phone")}</th>
                <th>
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    {locale === "ar" ? "رقم الهوية" : "National ID"}
                  </span>
                </th>
                <th>{t("gender")}</th>
                <th>{t("age")}</th>
                <th>{t("bloodType")}</th>
                <th>{t("totalVisits")}</th>
                <th className="text-center">{tc("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <User className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    {tc("noData")}
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td><span className="font-mono text-xs text-gray-500">{p.patientNumber}</span></td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="patient-avatar patient-avatar-sm">{p.name[0]}</div>
                      <div>
                        <p className="patient-name-primary">{p.name}</p>
                        {p.nameAr && <p className="patient-name-secondary">{p.nameAr}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-600">{p.phone}</td>
                  <td>
                    {p.nationalId ? (
                      <span className="font-mono text-xs font-semibold" style={{ color: "var(--text-1)" }}>
                        {p.nationalId}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-500/70 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400/60 inline-block" />
                        {locale === "ar" ? "غير مسجّل" : "Missing"}
                      </span>
                    )}
                  </td>
                  <td>
                    <Badge variant={p.gender === "male" ? "info" : "purple"}>
                      {p.gender === "male" ? (locale === "ar" ? "ذكر" : "Male") : (locale === "ar" ? "أنثى" : "Female")}
                    </Badge>
                  </td>
                  <td>{p.dateOfBirth ? `${calculateAge(p.dateOfBirth)} ${locale === "ar" ? "سنة" : "y"}` : "—"}</td>
                  <td>{p.bloodType ? <span className="font-medium text-red-600">{p.bloodType}</span> : "—"}</td>
                  <td><span className="font-semibold text-gray-700">{p._count.appointments}</span></td>
                  <td>
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-500 hover:bg-indigo-50"
                        title={locale === "ar" ? "ملف المريض" : "Patient File"}
                        onClick={() => openHistory(p.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
                        title={locale === "ar" ? "تعديل" : "Edit"}
                        onClick={() => { setEditPatient(p); setModalOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t px-4 py-3 text-sm text-gray-500">
            {locale === "ar" ? `${filtered.length} مريض` : `${filtered.length} patients`}
          </div>
        )}
      </div>

      {/* ── Patient History Modal ── */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setHistoryOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/8 bg-[#0f1629] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-indigo-400" />
                <h2 className="text-base font-semibold text-white">
                  {locale === "ar" ? "ملف المريض الطبي" : "Patient Medical File"}
                </h2>
              </div>
              <button onClick={() => setHistoryOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {historyLoading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">{locale === "ar" ? "جاري التحميل..." : "Loading..."}</span>
                </div>
              ) : !patientHistory ? (
                <div className="text-center py-12 text-slate-600 text-sm">
                  {locale === "ar" ? "لا توجد بيانات" : "No data found"}
                </div>
              ) : (
                <>
                  {/* Patient summary strip */}
                  <div className="rounded-xl bg-indigo-500/8 border border-indigo-500/15 p-4 flex flex-wrap gap-4 items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 font-bold text-lg">
                      {patientHistory.patient.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{patientHistory.patient.name}</p>
                      {patientHistory.patient.nameAr && <p className="text-sm text-slate-400">{patientHistory.patient.nameAr}</p>}
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                        <span>{patientHistory.patient.phone}</span>
                        {patientHistory.patient.nationalId && <span className="font-mono">{patientHistory.patient.nationalId}</span>}
                        {patientHistory.patient.dateOfBirth && <span>{calculateAge(patientHistory.patient.dateOfBirth)} {locale === "ar" ? "سنة" : "y"}</span>}
                        {patientHistory.patient.bloodType && <span className="text-red-400 font-semibold">{patientHistory.patient.bloodType}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 text-center">
                      <p className="text-2xl font-bold text-indigo-400">{patientHistory.appointments.length}</p>
                      <p className="text-xs text-slate-500">{locale === "ar" ? "زيارة مكتملة" : "visits"}</p>
                    </div>
                  </div>

                  {/* Medical background */}
                  {(patientHistory.patient.medicalHistory || patientHistory.patient.allergies) && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {patientHistory.patient.medicalHistory && (
                        <div className="rounded-xl bg-amber-500/8 border border-amber-500/15 p-3">
                          <p className="text-xs font-semibold text-amber-400 mb-1.5">{locale === "ar" ? "التاريخ المرضي" : "Medical History"}</p>
                          <p className="text-xs text-slate-400 leading-relaxed">{patientHistory.patient.medicalHistory}</p>
                        </div>
                      )}
                      {patientHistory.patient.allergies && (
                        <div className="rounded-xl bg-rose-500/8 border border-rose-500/15 p-3">
                          <p className="text-xs font-semibold text-rose-400 mb-1.5">{locale === "ar" ? "الحساسية" : "Allergies"}</p>
                          <p className="text-xs text-slate-400 leading-relaxed">{patientHistory.patient.allergies}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <PatientChartPanel doctorId={doctorId} patientId={patientHistory.patient.id} locale={locale} />

                  {/* Visit history */}
                  {patientHistory.appointments.length === 0 ? (
                    <div className="text-center py-8 text-slate-600 text-sm">
                      {locale === "ar" ? "لا توجد زيارات مكتملة بعد" : "No completed visits yet"}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {locale === "ar" ? "سجل الزيارات" : "Visit History"}
                      </p>
                      {patientHistory.appointments.map((apt, idx) => (
                        <div key={apt.id} className="rounded-xl border border-white/6 bg-white/3 p-4 space-y-3">
                          {/* Visit header */}
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                                {patientHistory.appointments.length - idx}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Calendar className="h-3 w-3" />
                                {formatDate(apt.date, locale)} · {formatTime(apt.date, locale)}
                              </div>
                            </div>
                            <span className="text-xs text-slate-600 font-mono">#{apt.appointmentNumber}</span>
                          </div>
                          {apt.reason && (
                            <p className="text-xs text-slate-500">
                              <span className="text-slate-600 font-medium">{locale === "ar" ? "السبب: " : "Reason: "}</span>
                              {apt.reason}
                            </p>
                          )}
                          {/* Medical data */}
                          <div className="space-y-2">
                            {apt.diagnosis && (
                              <div className="rounded-lg bg-blue-500/8 border border-blue-500/15 px-3 py-2">
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                                  {locale === "ar" ? "التشخيص / الحالة المرضية" : "Diagnosis"}
                                </p>
                                <p className="text-xs text-slate-300 leading-relaxed">{apt.diagnosis}</p>
                              </div>
                            )}
                            {apt.prescription && (
                              <div className="rounded-lg bg-purple-500/8 border border-purple-500/15 px-3 py-2">
                                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <Pill className="h-2.5 w-2.5" />
                                  {locale === "ar" ? "الوصفة الطبية" : "Prescription"}
                                </p>
                                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{apt.prescription}</p>
                              </div>
                            )}
                            {apt.notes && (
                              <div className="rounded-lg bg-slate-700/30 border border-white/6 px-3 py-2">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <FileText className="h-2.5 w-2.5" />
                                  {locale === "ar" ? "ملاحظات" : "Notes"}
                                </p>
                                <p className="text-xs text-slate-500 leading-relaxed">{apt.notes}</p>
                              </div>
                            )}
                            {!apt.diagnosis && !apt.prescription && !apt.notes && (
                              <p className="text-xs text-slate-700 italic">{locale === "ar" ? "لم تُسجَّل بيانات طبية لهذه الزيارة" : "No medical data recorded for this visit"}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditPatient(null); }}
        title={editPatient ? t("editPatient") : t("addPatient")} size="lg"
        footer={<>
          <Button variant="secondary" onClick={() => { setModalOpen(false); setEditPatient(null); }} disabled={loading}>{tc("cancel")}</Button>
          <Button type="submit" form="patient-form" loading={loading}>{tc("save")}</Button>
        </>}>
        <form id="patient-form" onSubmit={handleSubmit} className="space-y-4">
          {errors.general && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{errors.general}</div>}
          <Input name="name" label={locale === "ar" ? "اسم المريض" : "Patient Name"} defaultValue={editPatient?.name} required />
          <div className="grid grid-cols-2 gap-4">
            <Select name="gender" label={t("gender")} options={genderOptions} defaultValue={editPatient?.gender} placeholder={locale === "ar" ? "اختر" : "Select"} required />
            <Input name="dateOfBirth" type="date" label={t("dateOfBirth")} defaultValue={editPatient?.dateOfBirth ? new Date(editPatient.dateOfBirth).toISOString().split("T")[0] : ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input name="phone" type="tel" label={tc("phone")} defaultValue={editPatient?.phone} required />
            <Select name="bloodType" label={t("bloodType")} options={bloodTypeOptions} defaultValue={editPatient?.bloodType ?? ""} placeholder={locale === "ar" ? "اختر" : "Select"} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label flex items-center gap-1.5">
                🪪 {locale === "ar" ? "رقم الهوية الوطنية" : "National ID"}
                <span className="text-amber-500 text-[10px] font-normal">
                  {locale === "ar" ? "— مطلوب" : "— required"}
                </span>
              </label>
              <input
                name="nationalId"
                required
                dir="ltr"
                defaultValue={editPatient?.nationalId ?? ""}
                className="form-input w-full font-mono tracking-widest"
                placeholder={locale === "ar" ? "أدخل رقم الهوية" : "Enter national ID"}
                autoComplete="off"
              />
            </div>
            <Input name="insurance" label={t("insurance")} defaultValue={editPatient?.insurance ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input name="emergencyContact" label={t("emergencyContact")} defaultValue={editPatient?.emergencyContact ?? ""} />
            <Input name="emergencyPhone" type="tel" label={locale === "ar" ? "هاتف الطوارئ" : "Emergency Phone"} defaultValue={editPatient?.emergencyPhone ?? ""} />
          </div>
          <Textarea name="medicalHistory" label={t("medicalHistory")} defaultValue={editPatient?.medicalHistory ?? ""} rows={2} />
          <Textarea name="allergies" label={t("allergies")} defaultValue={editPatient?.allergies ?? ""} rows={2} />

          {/* Recurring patient toggle - only for relevant specialties */}
          {showRecurring && <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/6 p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" name="isRecurring"
                  defaultChecked={(editPatient as any)?.isRecurring ?? false}
                  className="sr-only peer" id="is-recurring" />
                <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-indigo-600 transition-colors" />
                <div className="absolute top-0.5 start-0.5 w-4 h-4 bg-[#fff] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.4)] transition-all peer-checked:translate-x-5" />
              </div>
              <p className="text-sm font-medium text-white">{locale === "ar" ? "مريض دائم / علاج متكرر" : "Recurring Patient / Treatment"}</p>
            </label>
          </div>}
          <Textarea name="notes" label={locale === "ar" ? "ملاحظات" : "Notes"} defaultValue={(editPatient as any)?.notes ?? ""} rows={2} placeholder={locale === "ar" ? "أي ملاحظات إضافية عن المريض..." : "Any additional notes about the patient..."} />
        </form>
      </Modal>
    </div>
  );
}
