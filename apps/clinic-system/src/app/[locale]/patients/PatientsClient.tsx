"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Eye, Pencil, Trash2, User } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PatientModal from "./PatientModal";
import { deletePatient } from "@/app/actions/patients";
import { calculateAge, formatDate } from "@/lib/utils";

interface Patient {
  id: string;
  patientNumber: string;
  name: string;
  nameAr: string | null;
  gender: string;
  phone: string;
  email: string | null;
  dateOfBirth: Date | null;
  bloodType: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: { appointments: number };
}

interface PatientsClientProps {
  patients: Patient[];
  locale: string;
  initialSearch: string;
}

export default function PatientsClient({ patients, locale, initialSearch }: PatientsClientProps) {
  const t = useTranslations("patients");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = (value: string) => {
    setSearch(value);
    startTransition(() => {
      router.push(`/${locale}/patients${value ? `?search=${encodeURIComponent(value)}` : ""}`);
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await deletePatient(deleteId);
    setDeleteId(null);
    setIsDeleting(false);
    router.refresh();
  };

  const handleAddSuccess = () => {
    setModalOpen(false);
    setEditPatient(null);
    router.refresh();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t("subtitle")}</p>
        </div>
        <Button onClick={() => { setEditPatient(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" />
          {t("addPatient")}
        </Button>
      </div>

      {/* Search & filters */}
      <div className="card p-4">
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-gray-300 ps-9 pe-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
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
                <th>{tc("status")}</th>
                <th className="text-center">{tc("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>{tc("noData")}</p>
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <span className="font-mono text-xs text-gray-500">{patient.patientNumber}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-xs">
                          {patient.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          {patient.nameAr && <p className="text-xs text-gray-400">{patient.nameAr}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="text-gray-600">{patient.phone}</td>
                    <td>
                      <Badge variant={patient.gender === "male" ? "info" : "purple"}>
                        {patient.gender === "male"
                          ? (locale === "ar" ? "ذكر" : "Male")
                          : (locale === "ar" ? "أنثى" : "Female")}
                      </Badge>
                    </td>
                    <td>
                      {patient.dateOfBirth
                        ? `${calculateAge(patient.dateOfBirth)} ${locale === "ar" ? "سنة" : "yrs"}`
                        : "—"}
                    </td>
                    <td>
                      {patient.bloodType ? (
                        <span className="font-medium text-red-600">{patient.bloodType}</span>
                      ) : "—"}
                    </td>
                    <td>
                      <span className="font-semibold text-gray-700">{patient._count.appointments}</span>
                    </td>
                    <td>
                      <Badge variant={patient.isActive ? "success" : "default"}>
                        {patient.isActive ? tc("active") : tc("inactive")}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                          onClick={() => router.push(`/${locale}/patients/${patient.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
                          onClick={() => { setEditPatient(patient); setModalOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteId(patient.id)}
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
        {patients.length > 0 && (
          <div className="border-t px-4 py-3 text-sm text-gray-500">
            {locale === "ar"
              ? `إجمالي ${patients.length} مريض`
              : `Total ${patients.length} patients`}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <PatientModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditPatient(null); }}
        onSuccess={handleAddSuccess}
        patient={editPatient}
        locale={locale}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title={locale === "ar" ? "حذف المريض" : "Delete Patient"}
        message={locale === "ar" ? "سيتم حذف جميع بيانات المريض ومواعيده. هذا الإجراء لا يمكن التراجع عنه." : "All patient data and appointments will be deleted. This action cannot be undone."}
      />
    </div>
  );
}
