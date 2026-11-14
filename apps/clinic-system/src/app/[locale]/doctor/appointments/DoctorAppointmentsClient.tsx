"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, Filter, CheckCircle, XCircle, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge, { getAppointmentStatusVariant } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { createAppointmentForDoctor, updateAppointmentStatus } from "@/app/actions/doctorPortal";
import { formatDate, formatTime } from "@/lib/utils";

interface Patient { id: string; name: string; phone: string; }
interface Appointment {
  id: string; appointmentNumber: string; date: Date; duration: number;
  type: string; status: string; reason: string | null; notes: string | null;
  patient: Patient;
}

export default function DoctorAppointmentsClient({ appointments, patients, doctorId, locale }: {
  appointments: Appointment[]; patients: Patient[]; doctorId: string; locale: string;
}) {
  const t = useTranslations("appointments");
  const tc = useTranslations("common");
  const dp = useTranslations("doctorPortal");
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = statusFilter ? appointments.filter(a => a.status === statusFilter) : appointments;

  const statusMap: Record<string, string> = {
    scheduled: t("scheduled"), confirmed: t("confirmed"),
    completed: t("completed"), cancelled: t("cancelled"), noShow: t("noShow"),
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setErrors({});
    const fd = new FormData(e.currentTarget);
    const dateStr = fd.get("date") as string;
    const timeStr = fd.get("time") as string;
    if (!dateStr || !timeStr) { setErrors({ date: tc("required") }); setLoading(false); return; }

    const result = await createAppointmentForDoctor(doctorId, {
patientId: fd.get("patientId") as string,
      date: (() => {
        const [y, m, d] = dateStr.split("-").map(Number);
        const [h, min] = timeStr.split(":").map(Number);
        return new Date(y, m - 1, d, h, min, 0).toISOString();
      })(),
      duration: parseInt(fd.get("duration") as string) || 30,
      type: fd.get("type") as string || "consultation",
      status: "scheduled",
      reason: fd.get("reason") as string || undefined,
      notes: fd.get("notes") as string || undefined,
    });
    setLoading(false);
    if (result.success) { setModalOpen(false); router.refresh(); }
  };

  const handleStatusChange = async (appointmentId: string, status: string) => {
    await updateAppointmentStatus(appointmentId, doctorId, status);
    router.refresh();
  };

  const patientOptions = patients.map(p => ({ value: p.id, label: `${p.name} — ${p.phone}` }));
  const typeOptions = [
    { value: "consultation", label: t("consultation") },
    { value: "followUp", label: t("followUp") },
    { value: "emergency", label: t("emergency") },
    { value: "procedure", label: t("procedure") },
  ];
  const durationOptions = [15, 30, 45, 60, 90].map(d => ({ value: String(d), label: `${d} ${t("minutes")}` }));
  const filterOptions = [
    { value: "", label: tc("all") },
    { value: "scheduled", label: t("scheduled") },
    { value: "confirmed", label: t("confirmed") },
    { value: "completed", label: t("completed") },
    { value: "cancelled", label: t("cancelled") },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dp("myAppointments")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("addAppointment")}
        </Button>
      </div>

      {/* Filter */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <Filter className="h-4 w-4" />{tc("filter")}:
          </span>
          {filterOptions.map(opt => (
            <button key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === opt.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("patient")}</th>
                <th>{t("date")}</th>
                <th>{t("type")}</th>
                <th>{t("reason")}</th>
                <th>{t("status")}</th>
                <th className="text-center">{locale === "ar" ? "تغيير الحالة" : "Change Status"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    {tc("noData")}
                  </td>
                </tr>
              ) : filtered.map(apt => (
                <tr key={apt.id}>
                  <td>
                    <p className="font-medium text-gray-900">{apt.patient.name}</p>
                    <p className="text-xs text-gray-400">{apt.patient.phone}</p>
                  </td>
                  <td>
                    <p className="text-sm font-medium text-gray-800">{formatDate(apt.date, locale)}</p>
                    <p className="text-xs text-gray-400">{formatTime(apt.date, locale)}</p>
                  </td>
                  <td className="text-sm text-gray-600">
                    {typeOptions.find(o => o.value === apt.type)?.label ?? apt.type}
                  </td>
                  <td className="text-sm text-gray-500 max-w-32 truncate">{apt.reason ?? "—"}</td>
                  <td>
                    <Badge variant={getAppointmentStatusVariant(apt.status)}>
                      {statusMap[apt.status] ?? apt.status}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      {apt.status === "scheduled" && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-green-600 hover:bg-green-50 gap-1"
                          onClick={() => handleStatusChange(apt.id, "confirmed")}>
                          <CheckCircle className="h-3.5 w-3.5" />
                          {t("confirmed")}
                        </Button>
                      )}
                      {(apt.status === "scheduled" || apt.status === "confirmed") && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50 gap-1"
                          onClick={() => handleStatusChange(apt.id, "completed")}>
                          <CheckCircle className="h-3.5 w-3.5" />
                          {t("completed")}
                        </Button>
                      )}
                      {apt.status !== "cancelled" && apt.status !== "completed" && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-500 hover:bg-red-50 gap-1"
                          onClick={() => handleStatusChange(apt.id, "cancelled")}>
                          <XCircle className="h-3.5 w-3.5" />
                          {t("cancelled")}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t px-4 py-3 text-sm text-gray-500">
            {locale === "ar" ? `${filtered.length} موعد` : `${filtered.length} appointments`}
          </div>
        )}
      </div>

      {/* Modal: Add Appointment */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setErrors({}); }}
        title={t("addAppointment")} size="md"
        footer={<>
          <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={loading}>{tc("cancel")}</Button>
          <Button type="submit" form="apt-form" loading={loading}>{tc("save")}</Button>
        </>}>
        <form id="apt-form" onSubmit={handleSubmit} className="space-y-4">
          <Select name="patientId" label={t("patient")} options={patientOptions} placeholder={t("selectPatient")} required error={errors.patientId} />
          <div className="grid grid-cols-2 gap-4">
            <Input name="date" type="date" label={t("date")} required error={errors.date} />
            <Input name="time" type="time" label={t("time")} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select name="type" label={t("type")} options={typeOptions} defaultValue="consultation" />
            <Select name="duration" label={t("duration")} options={durationOptions} defaultValue="30" />
          </div>
          <Input name="reason" label={t("reason")} />
          <Textarea name="notes" label={tc("notes")} rows={2} />
        </form>
      </Modal>
    </div>
  );
}
