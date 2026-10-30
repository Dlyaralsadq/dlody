"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, Calendar, Filter } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge, { getAppointmentStatusVariant } from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AppointmentModal from "./AppointmentModal";
import { deleteAppointment } from "@/app/actions/appointments";
import { formatDate, formatTime } from "@/lib/utils";

interface Appointment {
  id: string;
  appointmentNumber: string;
  date: Date;
  duration: number;
  type: string;
  status: string;
  reason: string | null;
  notes: string | null;
  patient: { id: string; name: string; phone: string };
  doctor: {
    id: string;
    name: string;
    nameAr: string;
    specialty: { name: string; nameAr: string };
  };
}

interface Patient {
  id: string;
  name: string;
  phone: string;
}

interface Doctor {
  id: string;
  name: string;
  nameAr: string;
  specialty: { name: string; nameAr: string };
}

interface AppointmentsClientProps {
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
  locale: string;
}

export default function AppointmentsClient({ appointments, patients, doctors, locale }: AppointmentsClientProps) {
  const t = useTranslations("appointments");
  const tc = useTranslations("common");
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await deleteAppointment(deleteId);
    setDeleteId(null);
    setIsDeleting(false);
    router.refresh();
  };

  const filteredAppointments = statusFilter
    ? appointments.filter((a) => a.status === statusFilter)
    : appointments;

  const statusOptions = [
    { value: "", label: tc("all") },
    { value: "scheduled", label: t("scheduled") },
    { value: "confirmed", label: t("confirmed") },
    { value: "completed", label: t("completed") },
    { value: "cancelled", label: t("cancelled") },
    { value: "noShow", label: t("noShow") },
  ];

  const appointmentStatusLabels: Record<string, string> = {
    scheduled: t("scheduled"),
    confirmed: t("confirmed"),
    completed: t("completed"),
    cancelled: t("cancelled"),
    noShow: t("noShow"),
  };

  const appointmentTypeLabels: Record<string, string> = {
    consultation: t("consultation"),
    followUp: t("followUp"),
    emergency: t("emergency"),
    procedure: t("procedure"),
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t("subtitle")}</p>
        </div>
        <Button onClick={() => { setEditAppointment(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" />
          {t("addAppointment")}
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Filter className="h-4 w-4" />
            {tc("filter")}:
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === option.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("appointmentId")}</th>
                <th>{t("patient")}</th>
                <th>{t("doctor")}</th>
                <th>{t("date")}</th>
                <th>{t("type")}</th>
                <th>{t("duration")}</th>
                <th>{t("status")}</th>
                <th className="text-center">{tc("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>{tc("noData")}</p>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.id}>
                    <td>
                      <span className="font-mono text-xs text-gray-500">{apt.appointmentNumber}</span>
                    </td>
                    <td>
                      <p className="font-medium text-gray-900">{apt.patient.name}</p>
                      <p className="text-xs text-gray-400">{apt.patient.phone}</p>
                    </td>
                    <td>
                      <p className="font-medium text-gray-800">
                        {locale === "ar" ? apt.doctor.nameAr : apt.doctor.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {locale === "ar" ? apt.doctor.specialty.nameAr : apt.doctor.specialty.name}
                      </p>
                    </td>
                    <td>
                      <p className="text-sm font-medium text-gray-800">{formatDate(apt.date, locale)}</p>
                      <p className="text-xs text-gray-400">{formatTime(apt.date, locale)}</p>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600">
                        {appointmentTypeLabels[apt.type] ?? apt.type}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600">{apt.duration} {t("minutes")}</span>
                    </td>
                    <td>
                      <Badge variant={getAppointmentStatusVariant(apt.status)}>
                        {appointmentStatusLabels[apt.status] ?? apt.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
                          onClick={() => { setEditAppointment(apt); setModalOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteId(apt.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredAppointments.length > 0 && (
          <div className="border-t px-4 py-3 text-sm text-gray-500">
            {locale === "ar"
              ? `إجمالي ${filteredAppointments.length} موعد`
              : `Total ${filteredAppointments.length} appointments`}
          </div>
        )}
      </div>

      {/* Modal */}
      <AppointmentModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditAppointment(null); }}
        onSuccess={() => { setModalOpen(false); setEditAppointment(null); router.refresh(); }}
        appointment={editAppointment}
        patients={patients}
        doctors={doctors}
        locale={locale}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title={locale === "ar" ? "حذف الموعد" : "Delete Appointment"}
      />
    </div>
  );
}
