"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, User } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { createPatientForDoctor, updatePatientForDoctor } from "@/app/actions/doctorPortal";
import { calculateAge } from "@/lib/utils";

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

  const filtered = search
    ? patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.nameAr?.includes(search) ?? false) ||
        p.phone.includes(search)
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

      <div className="card p-4">
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            value={search}
            dir="auto" onChange={e => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-gray-300 ps-9 pe-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("patientId")}</th>
                <th>{t("fullName")}</th>
                <th>{tc("phone")}</th>
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
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <User className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    {tc("noData")}
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td><span className="font-mono text-xs text-gray-500">{p.patientNumber}</span></td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-xs">
                        {p.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-white">{p.name}</p>
                        {p.nameAr && <p className="text-xs text-gray-400">{p.nameAr}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-600">{p.phone}</td>
                  <td>
                    <Badge variant={p.gender === "male" ? "info" : "purple"}>
                      {p.gender === "male" ? (locale === "ar" ? "ذكر" : "Male") : (locale === "ar" ? "أنثى" : "Female")}
                    </Badge>
                  </td>
                  <td>{p.dateOfBirth ? `${calculateAge(p.dateOfBirth)} ${locale === "ar" ? "سنة" : "y"}` : "—"}</td>
                  <td>{p.bloodType ? <span className="font-medium text-red-600">{p.bloodType}</span> : "—"}</td>
                  <td><span className="font-semibold text-gray-700">{p._count.appointments}</span></td>
                  <td>
                    <div className="flex justify-center">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
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
            <Input name="nationalId" label={t("nationalId")} defaultValue={editPatient?.nationalId ?? ""} />
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
                <div className="absolute top-0.5 start-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{locale === "ar" ? "مريض دائم / علاج متكرر" : "Recurring Patient / Treatment"}</p>
                <p className="text-xs text-white/30">{locale === "ar" ? "مثل تقويم الأسنان أو زراعة الأسنان" : "e.g. Orthodontics, implants"}</p>
              </div>
            </label>
          </div>}
          <Textarea name="notes" label={locale === "ar" ? "ملاحظات" : "Notes"} defaultValue={(editPatient as any)?.notes ?? ""} rows={2} placeholder={locale === "ar" ? "أي ملاحظات إضافية عن المريض..." : "Any additional notes about the patient..."} />
        </form>
      </Modal>
    </div>
  );
}
