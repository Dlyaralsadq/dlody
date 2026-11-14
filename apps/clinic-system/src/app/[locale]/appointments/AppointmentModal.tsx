"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { createAppointment, updateAppointment } from "@/app/actions/appointments";

interface Patient { id: string; name: string; }
interface Doctor {
  id: string;
  name: string;
  nameAr: string;
  specialty: { name: string; nameAr: string };
}

interface Appointment {
  id: string;
  patientId?: string;
  doctorId?: string;
  date: Date;
  duration: number;
  type: string;
  status: string;
  reason: string | null;
  notes: string | null;
  patient: Patient;
  doctor: Doctor;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment: Appointment | null;
  patients: Patient[];
  doctors: Doctor[];
  locale: string;
}

export default function AppointmentModal({ isOpen, onClose, onSuccess, appointment, patients, doctors, locale }: AppointmentModalProps) {
  const t = useTranslations("appointments");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!appointment;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const dateStr = formData.get("date") as string;
    const timeStr = formData.get("time") as string;

    if (!dateStr || !timeStr) {
      setErrors({ date: tc("required") });
      setLoading(false);
      return;
    }

    const dateTime = new Date(`${dateStr}T${timeStr}:00`);

    const data = {
      patientId: formData.get("patientId") as string,
      doctorId: formData.get("doctorId") as string,
      date: dateTime.toISOString(),
      duration: parseInt(formData.get("duration") as string) || 30,
      type: formData.get("type") as string,
      status: formData.get("status") as string,
      reason: formData.get("reason") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    };

    if (!data.patientId) { setErrors({ patientId: tc("required") }); setLoading(false); return; }
    if (!data.doctorId) { setErrors({ doctorId: tc("required") }); setLoading(false); return; }

    try {
      if (isEdit && appointment) {
        await updateAppointment(appointment.id, data);
      } else {
        await createAppointment(data);
      }
      onSuccess();
    } catch {
      setErrors({ general: tc("error") });
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return new Date(date).toISOString().split("T")[0];
  };

  const formatTimeForInput = (date: Date) => {
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const patientOptions = patients.map((p) => ({ value: p.id, label: p.name }));
  const doctorOptions = doctors.map((d) => ({
    value: d.id,
    label: `${locale === "ar" ? d.nameAr : d.name} - ${locale === "ar" ? d.specialty.nameAr : d.specialty.name}`,
  }));

  const typeOptions = [
    { value: "consultation", label: t("consultation") },
    { value: "followUp", label: t("followUp") },
    { value: "emergency", label: t("emergency") },
    { value: "procedure", label: t("procedure") },
  ];

  const statusOptions = [
    { value: "scheduled", label: t("scheduled") },
    { value: "confirmed", label: t("confirmed") },
    { value: "completed", label: t("completed") },
    { value: "cancelled", label: t("cancelled") },
    { value: "noShow", label: t("noShow") },
  ];

  const durationOptions = [
    { value: "15", label: `15 ${t("minutes")}` },
    { value: "30", label: `30 ${t("minutes")}` },
    { value: "45", label: `45 ${t("minutes")}` },
    { value: "60", label: `60 ${t("minutes")}` },
    { value: "90", label: `90 ${t("minutes")}` },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t("editAppointment") : t("addAppointment")}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{tc("cancel")}</Button>
          <Button type="submit" form="appointment-form" loading={loading}>{tc("save")}</Button>
        </>
      }
    >
      <form id="appointment-form" onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            name="patientId"
            label={t("patient")}
            options={patientOptions}
            placeholder={t("selectPatient")}
            defaultValue={appointment?.patient.id ?? ""}
            required
            error={errors.patientId}
          />
          <Select
            name="doctorId"
            label={t("doctor")}
            options={doctorOptions}
            placeholder={t("selectDoctor")}
            defaultValue={appointment?.doctor.id ?? ""}
            required
            error={errors.doctorId}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="date"
            type="date"
            label={t("date")}
            defaultValue={appointment ? formatDateForInput(appointment.date) : ""}
            required
            error={errors.date}
          />
          <Input
            name="time"
            type="time"
            label={t("time")}
            defaultValue={appointment ? formatTimeForInput(appointment.date) : ""}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            name="type"
            label={t("type")}
            options={typeOptions}
            defaultValue={appointment?.type ?? "consultation"}
          />
          <Select
            name="duration"
            label={t("duration")}
            options={durationOptions}
            defaultValue={appointment?.duration.toString() ?? "30"}
          />
          <Select
            name="status"
            label={t("status")}
            options={statusOptions}
            defaultValue={appointment?.status ?? "scheduled"}
          />
        </div>

        <Input
          name="reason"
          label={t("reason")}
          defaultValue={appointment?.reason ?? ""}
        />

        <Textarea
          name="notes"
          label={tc("notes")}
          defaultValue={appointment?.notes ?? ""}
          rows={2}
        />
      </form>
    </Modal>
  );
}
