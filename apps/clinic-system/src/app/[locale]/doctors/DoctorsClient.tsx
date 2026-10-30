"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, Stethoscope, Star } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DoctorModal from "./DoctorModal";
import { deleteDoctor } from "@/app/actions/doctors";

interface Specialty {
  id: string;
  name: string;
  nameAr: string;
  _count: { doctors: number };
}

interface Doctor {
  id: string;
  name: string;
  nameAr: string;
  email: string | null;
  phone: string | null;
  specialtyId: string;
  specialty: { id: string; name: string; nameAr: string };
  licenseNumber: string | null;
  qualification: string | null;
  experienceYears: number | null;
  consultationFee: number | null;
  workingDays: string | null;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  bio: string | null;
  bioAr: string | null;
  isActive: boolean;
  _count: { appointments: number };
}

interface DoctorsClientProps {
  doctors: Doctor[];
  specialties: Specialty[];
  locale: string;
}

export default function DoctorsClient({ doctors, specialties, locale }: DoctorsClientProps) {
  const t = useTranslations("doctors");
  const tc = useTranslations("common");
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await deleteDoctor(deleteId);
    setDeleteId(null);
    setIsDeleting(false);
    router.refresh();
  };

  const filtered = search
    ? doctors.filter(
        (d) =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.nameAr.includes(search) ||
          d.specialty.name.toLowerCase().includes(search.toLowerCase()) ||
          d.specialty.nameAr.includes(search)
      )
    : doctors;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t("subtitle")}</p>
        </div>
        <Button onClick={() => { setEditDoctor(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" />
          {t("addDoctor")}
        </Button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-gray-300 ps-9 pe-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{tc("noData")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((doctor) => (
            <div key={doctor.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg">
                    {doctor.name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {locale === "ar" ? doctor.nameAr : doctor.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {locale === "ar" ? doctor.specialty.nameAr : doctor.specialty.name}
                    </p>
                  </div>
                </div>
                <Badge variant={doctor.isActive ? "success" : "default"}>
                  {doctor.isActive ? tc("active") : tc("inactive")}
                </Badge>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {doctor.phone && (
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="text-gray-400">{tc("phone")}</span>
                    <span>{doctor.phone}</span>
                  </div>
                )}
                {doctor.experienceYears && (
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="text-gray-400">{t("experience")}</span>
                    <span>{doctor.experienceYears} {t("years")}</span>
                  </div>
                )}
                {doctor.consultationFee && (
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="text-gray-400">{t("consultationFee")}</span>
                    <span className="font-medium text-blue-600">{doctor.consultationFee} {locale === "ar" ? "ر.س" : "SAR"}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-gray-600">
                  <span className="text-gray-400">{t("appointmentsCount")}</span>
                  <span className="font-semibold">{doctor._count.appointments}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => { setEditDoctor(doctor); setModalOpen(true); }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {tc("edit")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:bg-red-50"
                  onClick={() => setDeleteId(doctor.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <DoctorModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditDoctor(null); }}
        onSuccess={() => { setModalOpen(false); setEditDoctor(null); router.refresh(); }}
        doctor={editDoctor}
        specialties={specialties}
        locale={locale}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title={locale === "ar" ? "حذف الطبيب" : "Delete Doctor"}
      />
    </div>
  );
}
