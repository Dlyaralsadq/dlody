"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ClipboardList } from "lucide-react";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { createSpecialty, updateSpecialty, deleteSpecialty } from "@/app/actions/doctors";

interface Specialty {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  descriptionAr: string | null;
  isActive: boolean;
  _count: { doctors: number };
}

interface SpecialtiesClientProps {
  specialties: Specialty[];
  locale: string;
}

interface FormData {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
}

export default function SpecialtiesClient({ specialties, locale }: SpecialtiesClientProps) {
  const t = useTranslations("specialties");
  const tc = useTranslations("common");
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [editSpecialty, setEditSpecialty] = useState<Specialty | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await deleteSpecialty(deleteId);
    setDeleteId(null);
    setIsDeleting(false);
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const fd = new FormData(e.currentTarget);
    const data: FormData = {
      name: fd.get("name") as string,
      nameAr: fd.get("nameAr") as string,
      description: fd.get("description") as string || undefined,
      descriptionAr: fd.get("descriptionAr") as string || undefined,
    };

    if (!data.name) { setErrors({ name: tc("required") }); setLoading(false); return; }
    if (!data.nameAr) { setErrors({ nameAr: tc("required") }); setLoading(false); return; }

    try {
      if (editSpecialty) {
        await updateSpecialty(editSpecialty.id, data);
      } else {
        await createSpecialty(data as Parameters<typeof createSpecialty>[0]);
      }
      setModalOpen(false);
      setEditSpecialty(null);
      router.refresh();
    } catch {
      setErrors({ general: tc("error") });
    } finally {
      setLoading(false);
    }
  };

  const specialtyIcons: Record<string, string> = {
    cardiology: "❤️",
    neurology: "🧠",
    orthopedics: "🦴",
    pediatrics: "👶",
    dermatology: "🩺",
    ophthalmology: "👁️",
    dentistry: "🦷",
    gastroenterology: "🫁",
    default: "🏥",
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t("subtitle")}</p>
        </div>
        <Button onClick={() => { setEditSpecialty(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" />
          {t("addSpecialty")}
        </Button>
      </div>

      {/* Grid */}
      {specialties.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{tc("noData")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {specialties.map((specialty) => (
            <div key={specialty.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                  {specialtyIcons[specialty.name.toLowerCase().split(" ").join("")] ?? specialtyIcons.default}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-500 hover:bg-gray-100"
                    onClick={() => { setEditSpecialty(specialty); setModalOpen(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-400 hover:bg-red-50"
                    onClick={() => setDeleteId(specialty.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="font-semibold text-gray-900">
                  {locale === "ar" ? specialty.nameAr : specialty.name}
                </h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  {locale === "ar" ? specialty.name : specialty.nameAr}
                </p>
                {(locale === "ar" ? specialty.descriptionAr : specialty.description) && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                    {locale === "ar" ? specialty.descriptionAr : specialty.description}
                  </p>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2 border-t pt-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                  {specialty._count.doctors}
                </div>
                <span className="text-xs text-gray-500">{t("doctorsCount")}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditSpecialty(null); setErrors({}); }}
        title={editSpecialty ? t("editSpecialty") : t("addSpecialty")}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setModalOpen(false); setEditSpecialty(null); setErrors({}); }}
              disabled={loading}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" form="specialty-form" loading={loading}>
              {tc("save")}
            </Button>
          </>
        }
      >
        <form id="specialty-form" onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {errors.general}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              name="name"
              label={locale === "ar" ? "الاسم بالإنجليزية" : t("specialtyName")}
              defaultValue={editSpecialty?.name ?? ""}
              required
              error={errors.name}
              placeholder="e.g. Cardiology"
            />
            <Input
              name="nameAr"
              label={locale === "ar" ? t("specialtyName") : "الاسم بالعربية"}
              defaultValue={editSpecialty?.nameAr ?? ""}
              required
              error={errors.nameAr}
              placeholder="مثال: أمراض القلب"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Textarea
              name="description"
              label={locale === "ar" ? "الوصف بالإنجليزية" : t("description")}
              defaultValue={editSpecialty?.description ?? ""}
              rows={3}
            />
            <Textarea
              name="descriptionAr"
              label={locale === "ar" ? t("description") : "الوصف بالعربية"}
              defaultValue={editSpecialty?.descriptionAr ?? ""}
              rows={3}
            />
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title={locale === "ar" ? "حذف التخصص" : "Delete Specialty"}
      />
    </div>
  );
}
