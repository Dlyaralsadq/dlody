"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { createDoctor, updateDoctor } from "@/app/actions/doctors";

interface Specialty {
  id: string;
  name: string;
  nameAr: string;
}

interface Doctor {
  id: string;
  name: string;
  nameAr: string;
  email: string | null;
  phone: string | null;
  specialtyId: string;
  licenseNumber: string | null;
  qualification: string | null;
  qualificationAr?: string | null;
  experienceYears: number | null;
  consultationFee: number | null;
  workingDays: string | null;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  bio: string | null;
  bioAr: string | null;
}

interface DoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  doctor: Doctor | null;
  specialties: Specialty[];
  locale: string;
}

export default function DoctorModal({ isOpen, onClose, onSuccess, doctor, specialties, locale }: DoctorModalProps) {
  const t = useTranslations("doctors");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!doctor;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      nameAr: formData.get("nameAr") as string,
      email: formData.get("email") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      specialtyId: formData.get("specialtyId") as string,
      licenseNumber: formData.get("licenseNumber") as string || undefined,
      qualification: formData.get("qualification") as string || undefined,
      qualificationAr: formData.get("qualificationAr") as string || undefined,
      experienceYears: formData.get("experienceYears") ? parseInt(formData.get("experienceYears") as string) : undefined,
      consultationFee: formData.get("consultationFee") ? parseFloat(formData.get("consultationFee") as string) : undefined,
      workingDays: formData.get("workingDays") as string || undefined,
      workingHoursStart: formData.get("workingHoursStart") as string || undefined,
      workingHoursEnd: formData.get("workingHoursEnd") as string || undefined,
      bio: formData.get("bio") as string || undefined,
      bioAr: formData.get("bioAr") as string || undefined,
    };

    if (!data.name) { setErrors({ name: tc("required") }); setLoading(false); return; }
    if (!data.nameAr) { setErrors({ nameAr: tc("required") }); setLoading(false); return; }
    if (!data.specialtyId) { setErrors({ specialtyId: tc("required") }); setLoading(false); return; }

    try {
      if (isEdit && doctor) {
        await updateDoctor(doctor.id, data);
      } else {
        await createDoctor(data as Parameters<typeof createDoctor>[0]);
      }
      onSuccess();
    } catch {
      setErrors({ general: tc("error") });
    } finally {
      setLoading(false);
    }
  };

  const specialtyOptions = specialties.map((s) => ({
    value: s.id,
    label: locale === "ar" ? s.nameAr : s.name,
  }));

  const dayOptions = [
    { value: "sat-thu", label: locale === "ar" ? "السبت - الخميس" : "Sat - Thu" },
    { value: "sun-thu", label: locale === "ar" ? "الأحد - الخميس" : "Sun - Thu" },
    { value: "sat-wed", label: locale === "ar" ? "السبت - الأربعاء" : "Sat - Wed" },
    { value: "mon-fri", label: locale === "ar" ? "الاثنين - الجمعة" : "Mon - Fri" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t("editDoctor") : t("addDoctor")}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{tc("cancel")}</Button>
          <Button type="submit" form="doctor-form" loading={loading}>{tc("save")}</Button>
        </>
      }
    >
      <form id="doctor-form" onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="name"
            label={locale === "ar" ? "الاسم بالإنجليزية" : t("fullName")}
            defaultValue={doctor?.name}
            required
            error={errors.name}
          />
          <Input
            name="nameAr"
            label={locale === "ar" ? t("fullName") : "الاسم بالعربية"}
            defaultValue={doctor?.nameAr}
            required
            error={errors.nameAr}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            name="specialtyId"
            label={t("specialty")}
            options={specialtyOptions}
            placeholder={locale === "ar" ? "اختر التخصص" : "Select specialty"}
            defaultValue={doctor?.specialtyId}
            required
            error={errors.specialtyId}
          />
          <Input
            name="licenseNumber"
            label={t("licenseNumber")}
            defaultValue={doctor?.licenseNumber ?? ""}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="phone"
            type="tel"
            label={tc("phone")}
            defaultValue={doctor?.phone ?? ""}
          />
          <Input
            name="email"
            type="email"
            label={tc("email")}
            defaultValue={doctor?.email ?? ""}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="qualification"
            label={locale === "ar" ? "المؤهل بالإنجليزية" : t("qualification")}
            defaultValue={doctor?.qualification ?? ""}
          />
          <Input
            name="qualificationAr"
            label={locale === "ar" ? t("qualification") : "المؤهل بالعربية"}
            defaultValue={doctor?.qualificationAr ?? ""}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="experienceYears"
            type="number"
            min="0"
            max="60"
            label={t("experience")}
            defaultValue={doctor?.experienceYears?.toString() ?? ""}
          />
          <Input
            name="consultationFee"
            type="number"
            min="0"
            label={t("consultationFee")}
            defaultValue={doctor?.consultationFee?.toString() ?? ""}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            name="workingDays"
            label={t("workingDays")}
            options={dayOptions}
            placeholder={locale === "ar" ? "اختر أيام العمل" : "Select working days"}
            defaultValue={doctor?.workingDays ?? ""}
          />
          <Input
            name="workingHoursStart"
            type="time"
            label={locale === "ar" ? "بداية الدوام" : "Start Time"}
            defaultValue={doctor?.workingHoursStart ?? "08:00"}
          />
          <Input
            name="workingHoursEnd"
            type="time"
            label={locale === "ar" ? "نهاية الدوام" : "End Time"}
            defaultValue={doctor?.workingHoursEnd ?? "16:00"}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Textarea
            name="bio"
            label={locale === "ar" ? "النبذة بالإنجليزية" : t("bio")}
            defaultValue={doctor?.bio ?? ""}
            rows={2}
          />
          <Textarea
            name="bioAr"
            label={locale === "ar" ? t("bio") : "النبذة بالعربية"}
            defaultValue={doctor?.bioAr ?? ""}
            rows={2}
          />
        </div>
      </form>
    </Modal>
  );
}
