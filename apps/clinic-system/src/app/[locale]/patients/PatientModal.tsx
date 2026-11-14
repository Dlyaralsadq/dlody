"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { createPatient, updatePatient } from "@/app/actions/patients";

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient?: {
    id: string;
    name: string;
    nameAr: string | null;
    gender: string;
    phone: string;
    email: string | null;
    dateOfBirth: Date | null;
    bloodType: string | null;
    nationalId?: string | null;
    insurance?: string | null;
    medicalHistory?: string | null;
    allergies?: string | null;
    emergencyContact?: string | null;
    emergencyPhone?: string | null;
    address?: string | null;
  } | null;
  locale: string;
}

export default function PatientModal({ isOpen, onClose, onSuccess, patient, locale }: PatientModalProps) {
  const t = useTranslations("patients");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!patient;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      nameAr: formData.get("nameAr") as string || undefined,
      gender: formData.get("gender") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string || undefined,
      dateOfBirth: formData.get("dateOfBirth") as string || undefined,
      bloodType: formData.get("bloodType") as string || undefined,
      nationalId: formData.get("nationalId") as string || undefined,
      insurance: formData.get("insurance") as string || undefined,
      address: formData.get("address") as string || undefined,
      medicalHistory: formData.get("medicalHistory") as string || undefined,
      allergies: formData.get("allergies") as string || undefined,
      emergencyContact: formData.get("emergencyContact") as string || undefined,
      emergencyPhone: formData.get("emergencyPhone") as string || undefined,
    };

    if (!data.name) { setErrors({ name: tc("required") }); setLoading(false); return; }
    if (!data.phone) { setErrors({ phone: tc("required") }); setLoading(false); return; }
    if (!data.gender) { setErrors({ gender: tc("required") }); setLoading(false); return; }

    try {
      if (isEdit && patient) {
        await updatePatient(patient.id, data);
      } else {
        await createPatient(data as Parameters<typeof createPatient>[0]);
      }
      onSuccess();
    } catch {
      setErrors({ general: tc("error") });
    } finally {
      setLoading(false);
    }
  };

  const genderOptions = [
    { value: "male", label: locale === "ar" ? "ذكر" : "Male" },
    { value: "female", label: locale === "ar" ? "أنثى" : "Female" },
  ];

  const bloodTypeOptions = [
    { value: "A+", label: "A+" }, { value: "A-", label: "A-" },
    { value: "B+", label: "B+" }, { value: "B-", label: "B-" },
    { value: "AB+", label: "AB+" }, { value: "AB-", label: "AB-" },
    { value: "O+", label: "O+" }, { value: "O-", label: "O-" },
  ];

  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t("editPatient") : t("addPatient")}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {tc("cancel")}
          </Button>
          <Button type="submit" form="patient-form" loading={loading}>
            {tc("save")}
          </Button>
        </>
      }
    >
      <form id="patient-form" onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="name"
            label={locale === "ar" ? "الاسم بالإنجليزية" : t("fullName")}
            defaultValue={patient?.name}
            required
            error={errors.name}
            placeholder="Full name in English"
          />
          <Input
            name="nameAr"
            label={locale === "ar" ? t("fullName") : "الاسم بالعربية"}
            defaultValue={patient?.nameAr ?? ""}
            placeholder="الاسم الكامل بالعربية"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            name="gender"
            label={t("gender")}
            options={genderOptions}
            placeholder={locale === "ar" ? "اختر الجنس" : "Select gender"}
            defaultValue={patient?.gender}
            required
            error={errors.gender}
          />
          <Input
            name="dateOfBirth"
            type="date"
            label={t("dateOfBirth")}
            defaultValue={formatDateForInput(patient?.dateOfBirth ?? null)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="phone"
            type="tel"
            label={tc("phone")}
            defaultValue={patient?.phone}
            required
            error={errors.phone}
            placeholder="+966 5x xxx xxxx"
          />
          <Input
            name="email"
            type="email"
            label={tc("email")}
            defaultValue={patient?.email ?? ""}
            placeholder="email@example.com"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="nationalId"
            label={t("nationalId")}
            defaultValue={patient?.nationalId ?? ""}
          />
          <Select
            name="bloodType"
            label={t("bloodType")}
            options={bloodTypeOptions}
            placeholder={locale === "ar" ? "اختر فصيلة الدم" : "Select blood type"}
            defaultValue={patient?.bloodType ?? ""}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="insurance"
            label={t("insurance")}
            defaultValue={patient?.insurance ?? ""}
          />
          <Input
            name="address"
            label={tc("address")}
            defaultValue={patient?.address ?? ""}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="emergencyContact"
            label={t("emergencyContact")}
            defaultValue={patient?.emergencyContact ?? ""}
          />
          <Input
            name="emergencyPhone"
            type="tel"
            label={locale === "ar" ? "هاتف جهة الطوارئ" : "Emergency Phone"}
            defaultValue={patient?.emergencyPhone ?? ""}
          />
        </div>

        <Textarea
          name="medicalHistory"
          label={t("medicalHistory")}
          defaultValue={patient?.medicalHistory ?? ""}
          rows={2}
        />

        <Textarea
          name="allergies"
          label={t("allergies")}
          defaultValue={patient?.allergies ?? ""}
          rows={2}
        />
      </form>
    </Modal>
  );
}
