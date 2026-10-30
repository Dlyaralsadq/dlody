"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope, ClipboardList, ShieldCheck, Plus, Key, Trash2,
  CheckCircle, XCircle, AlertCircle, UserCheck, UserX, Activity
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { arabicToEnglish } from "@/lib/transliterate";
import dynamic from "next/dynamic";
const MapPicker = dynamic(() => import("@/components/ui/MapPicker"), { ssr: false });
import {
  createDoctorWithAccount, createAccountForDoctor,
  resetDoctorPassword, toggleDoctorStatus, deleteDoctorAndAccount,
  createSecretaryAccount, updateDoctorAndAccount,
  activateDoctorSubscription, getDoctorFullDetails,
} from "@/app/actions/admin";
import { setDoctorSubscription } from "@/app/actions/subscription";
import { sendMessage } from "@/app/actions/messages";

interface Specialty { id: string; name: string; nameAr: string; }
interface Doctor {
  id: string; name: string; nameAr: string; phone: string | null; email: string | null;
  specialtyId: string; specialty: { name: string; nameAr: string };
  licenseNumber: string | null; experienceYears: number | null;
  consultationFee: number | null; workingDays: string | null;
  workingHoursStart: string | null; workingHoursEnd: string | null;
  isActive: boolean; userId: string | null;
  user: { id: string; username: string; isActive: boolean } | null;
  _count: { appointments: number; patients: number };
}
interface Stats { totalDoctors: number; activeDoctors: number; totalSpecialties: number; totalPatients: number; doctorsWithAccounts: number; }

const dayOptions = [
  { value: "sat-thu", label_ar: "السبت - الخميس", label_en: "Sat - Thu" },
  { value: "sun-thu", label_ar: "الأحد - الخميس", label_en: "Sun - Thu" },
  { value: "sat-wed", label_ar: "السبت - الأربعاء", label_en: "Sat - Wed" },
  { value: "mon-fri", label_ar: "الاثنين - الجمعة", label_en: "Mon - Fri" },
];

export default function AdminDashboardClient({ stats, doctors, specialties, subscriptions, locale }: {
  stats: Stats; doctors: Doctor[]; specialties: Specialty[];
  subscriptions: { doctorId: string; expiresAt: Date }[];
  locale: string;
}) {
  const router = useRouter();
  const ar = locale === "ar";

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [accOpen, setAccOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [secOpen, setSecOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapData, setMapData] = useState<{ lat?: number; lng?: number; address?: string }>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");
  // Doctor detail panel
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<Awaited<ReturnType<typeof getDoctorFullDetails>> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activateMonths, setActivateMonths] = useState("12");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const now = new Date();
  const subMap = new Map(subscriptions.map(s => [s.doctorId, s.expiresAt]));
  const isSubscribed = (doctorId: string) => {
    const exp = subMap.get(doctorId);
    return exp ? new Date(exp) > now : false;
  };
  const subExpiry = (doctorId: string) => {
    const exp = subMap.get(doctorId);
    return exp ? new Date(exp) : null;
  };

  const openDetail = async (doc: Doctor) => {
    setDetailOpen(true);
    setDetailLoading(true);
    const data = await getDoctorFullDetails(doc.id);
    setDetailData(data);
    setDetailLoading(false);
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editDoctor) return;
    const fd = new FormData(e.currentTarget);
    const ok = await act(() => updateDoctorAndAccount(editDoctor.id, {
      name: fd.get("name") as string,
      nameAr: fd.get("nameAr") as string,
      phone: fd.get("phone") as string || undefined,
      email: fd.get("email") as string || undefined,
      specialtyId: fd.get("specialtyId") as string,
      licenseNumber: fd.get("licenseNumber") as string || undefined,
      experienceYears: fd.get("exp") ? parseInt(fd.get("exp") as string) : undefined,
      consultationFee: fd.get("fee") ? parseFloat(fd.get("fee") as string) : undefined,
      workingDays: fd.get("days") as string || undefined,
      workingHoursStart: fd.get("from") as string || undefined,
      workingHoursEnd: fd.get("to") as string || undefined,
      ...(logoPreview ? { logoUrl: logoPreview } : {}),
      ...(mapData.lat ? { clinicLat: mapData.lat, clinicLng: mapData.lng, clinicAddress: mapData.address } : {}),
    }));
    if (ok) { setEditOpen(false); setEditDoctor(null); showToast(ar ? "تم تحديث بيانات الطبيب" : "Doctor updated"); }
  };

  const act = async (fn: () => Promise<{ success: boolean; error?: string }>) => {
    setLoading(true); setErrors({});
    const r = await fn();
    setLoading(false);
    if (r.success) { router.refresh(); return true; }
    if (r.error === "username_taken") setErrors({ username: ar ? "اسم المستخدم مستخدم بالفعل" : "Username taken" });
    return false;
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ok = await act(() => createDoctorWithAccount({
      name: fd.get("name") as string, nameAr: fd.get("nameAr") as string,
      phone: fd.get("phone") as string || undefined, email: fd.get("email") as string || undefined,
      specialtyId: fd.get("specialtyId") as string,
      licenseNumber: fd.get("licenseNumber") as string || undefined,
      experienceYears: fd.get("exp") ? parseInt(fd.get("exp") as string) : undefined,
      consultationFee: fd.get("fee") ? parseFloat(fd.get("fee") as string) : undefined,
      workingDays: fd.get("days") as string || undefined,
      workingHoursStart: fd.get("from") as string || undefined,
      workingHoursEnd: fd.get("to") as string || undefined,
      username: fd.get("username") as string,
      password: fd.get("password") as string,
    }));
    if (ok) { setAddOpen(false); showToast(ar ? "تم إضافة الطبيب وحسابه بنجاح" : "Doctor and account created"); }
  };

  const handleCreateAcc = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) return;
    const fd = new FormData(e.currentTarget);
    const ok = await act(() => createAccountForDoctor(selected.id, fd.get("username") as string, fd.get("password") as string));
    if (ok) { setAccOpen(false); showToast(ar ? "تم إنشاء الحساب" : "Account created"); }
  };

  const handlePwd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) return;
    const fd = new FormData(e.currentTarget);
    const ok = await act(() => resetDoctorPassword(selected.id, fd.get("password") as string));
    if (ok) { setPwdOpen(false); showToast(ar ? "تم تغيير كلمة المرور" : "Password updated"); }
  };

  const handleSec = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) return;
    const fd = new FormData(e.currentTarget);
    const ok = await act(() => createSecretaryAccount(selected.id, fd.get("username") as string, fd.get("password") as string, fd.get("name") as string));
    if (ok) { setSecOpen(false); showToast(ar ? "تم إنشاء حساب السكرتير" : "Secretary account created"); }
  };

  const specOpts = specialties.map(s => ({ value: s.id, label: ar ? s.nameAr : s.name }));
  const daysOpts = dayOptions.map(d => ({ value: d.value, label: ar ? d.label_ar : d.label_en }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 end-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 border border-emerald-500 px-4 py-3 text-sm font-medium text-white shadow-2xl animate-slide-in">
          <CheckCircle className="h-4 w-4" />{toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            {ar ? "لوحة الإدارة" : "Admin Panel"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{ar ? "إدارة الأطباء والحسابات" : "Manage doctors and accounts"}</p>
        </div>
        <Button onClick={() => { setMapData({}); setLogoPreview(null); setAddOpen(true); }}>
          <Plus className="h-4 w-4" />{ar ? "إضافة طبيب" : "Add Doctor"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { n: stats.totalDoctors, label: ar ? "الأطباء" : "Doctors", icon: Stethoscope, color: "indigo" },
          { n: stats.activeDoctors, label: ar ? "نشطون" : "Active", icon: Activity, color: "emerald" },
          { n: stats.totalSpecialties, label: ar ? "التخصصات" : "Specialties", icon: ClipboardList, color: "violet" },
          { n: stats.doctorsWithAccounts, label: ar ? "لديهم حسابات" : "With Accounts", icon: ShieldCheck, color: "blue" },
        ].map(({ n, label, icon: Icon, color }) => (
          <div key={label} className="card-premium p-4 hover:border-white/12 transition-colors">
            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-${color}-500/10`}>
              <Icon className={`h-4.5 w-4.5 text-${color}-400`} />
            </div>
            <p className="text-2xl font-black text-white">{n}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Doctors table */}
      <div className="card-premium overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2536]">
          <h2 className="text-sm font-semibold text-white">{ar ? "الأطباء المسجلون" : "Registered Doctors"}</h2>
          <span className="text-xs text-slate-500">{doctors.length} {ar ? "طبيب" : "doctors"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{ar ? "الطبيب" : "Doctor"}</th>
                <th>{ar ? "التخصص" : "Specialty"}</th>
                <th>{ar ? "الهاتف" : "Phone"}</th>
                <th>{ar ? "المواعيد/المرضى" : "Appts/Patients"}</th>
                <th>{ar ? "الاشتراك" : "Subscription"}</th>
                <th>{ar ? "حساب النظام" : "Account"}</th>
                <th>{ar ? "الحالة" : "Status"}</th>
                <th className="text-center">{ar ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-600">{ar ? "لا يوجد أطباء" : "No doctors"}</td></tr>
              ) : doctors.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <button
                      className="flex items-center gap-3 hover:opacity-80 transition text-start"
                      onClick={() => openDetail(doc)}
                      title={ar ? "عرض تفاصيل الطبيب" : "View doctor details"}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 font-bold text-sm">
                        {doc.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-indigo-300 hover:text-indigo-200 text-sm underline-offset-2 hover:underline">{ar ? doc.nameAr : doc.name}</p>
                        <p className="text-xs text-slate-600">{ar ? doc.name : doc.nameAr}</p>
                      </div>
                    </button>
                  </td>
                  <td>
                    <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs text-indigo-300">
                      {ar ? doc.specialty.nameAr : doc.specialty.name}
                    </span>
                  </td>
                  <td className="text-sm text-slate-400">{doc.phone ?? "—"}</td>
                  <td className="text-sm text-slate-400">
                    <span className="font-semibold text-white">{doc._count.appointments}</span>
                    <span className="text-slate-600 mx-1">/</span>
                    <span>{doc._count.patients}</span>
                  </td>
                  <td>
                    {isSubscribed(doc.id) ? (
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                          <CheckCircle className="h-3 w-3" />{ar ? "مشترك" : "Active"}
                        </span>
                        {subExpiry(doc.id) && (
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            {ar ? "ينتهي " : "Exp: "}
                            {new Date(subExpiry(doc.id)!).toLocaleDateString("en-GB")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                        <AlertCircle className="h-3 w-3" />{ar ? "غير مشترك" : "Not subscribed"}
                      </span>
                    )}
                  </td>
                  <td>
                    {doc.user ? (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                          <code className="text-xs text-slate-300 font-mono">@{doc.user.username}</code>
                        </div>
                        <span className={`text-xs ${doc.user.isActive ? "text-emerald-400" : "text-red-400"}`}>
                          {doc.user.isActive ? (ar ? "نشط" : "Active") : (ar ? "معطل" : "Disabled")}
                        </span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-amber-400">
                        <AlertCircle className="h-3.5 w-3.5" />{ar ? "لا حساب" : "No account"}
                      </span>
                    )}
                  </td>
                  <td>
                    <Badge variant={doc.isActive ? "success" : "default"}>
                      {doc.isActive ? (ar ? "نشط" : "Active") : (ar ? "معطل" : "Inactive")}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      {!doc.user ? (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-400 hover:bg-blue-500/10 gap-1"
                          onClick={() => { setSelected(doc); setAccOpen(true); }}>
                          <ShieldCheck className="h-3.5 w-3.5" />{ar ? "حساب" : "Account"}
                        </Button>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-amber-400 hover:bg-amber-500/10"
                            title={ar ? "تغيير كلمة المرور" : "Reset password"}
                            onClick={() => { setSelected(doc); setPwdOpen(true); }}>
                            <Key className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-violet-400 hover:bg-violet-500/10 gap-1"
                            onClick={() => { setSelected(doc); setSecOpen(true); }}>
                            <ClipboardList className="h-3.5 w-3.5" />{ar ? "سكرتير" : "Secretary"}
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-cyan-400 hover:bg-cyan-500/10"
                        title={ar ? "تحديد انتهاء الاشتراك" : "Set subscription expiry"}
                        onClick={() => { setSelected(doc); setSubOpen(true); }}>
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </Button>
                      {doc.isActive ? (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-orange-400 hover:bg-orange-500/10"
                          title={ar ? "إيقاف الحساب" : "Suspend account"}
                          onClick={async () => { await toggleDoctorStatus(doc.id, false); router.refresh(); }}>
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-emerald-400 hover:bg-emerald-500/10"
                          title={ar ? "تأكيد الدفع وإعادة التفعيل" : "Confirm payment & reactivate"}
                          onClick={async () => { await toggleDoctorStatus(doc.id, true); router.refresh(); }}>
                          <UserCheck className="h-3.5 w-3.5" />
                          <span className="text-xs hidden sm:inline">{ar ? "تفعيل" : "Activate"}</span>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-indigo-400 hover:bg-indigo-500/10"
                        title={ar ? "تعديل بيانات الطبيب" : "Edit doctor"}
                        onClick={() => { setEditDoctor(doc); setLogoPreview(null); setMapData({ lat: (doc as any).clinicLat, lng: (doc as any).clinicLng, address: (doc as any).clinicAddress }); setEditOpen(true); }}>
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/10"
                        onClick={() => setDeleteId(doc.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Doctor Modal */}
      <Modal isOpen={addOpen} onClose={() => { setAddOpen(false); setErrors({}); }}
        title={ar ? "إضافة طبيب جديد" : "Add New Doctor"} size="xl"
        footer={<>
          <Button variant="secondary" onClick={() => setAddOpen(false)} disabled={loading}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="add-form" loading={loading}>{ar ? "إضافة" : "Add"}</Button>
        </>}>
        <form id="add-form" onSubmit={handleAdd} className="space-y-4">
          <div className="rounded-xl bg-indigo-500/8 border border-indigo-500/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" />{ar ? "بيانات الطبيب" : "Doctor Info"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input name="nameAr" label={ar ? "الاسم بالعربية" : "الاسم بالعربية"} required placeholder="د. محمد الأحمدي"
                onChange={(e) => {
                  const engInput = e.currentTarget.form?.querySelector<HTMLInputElement>("[name=\"name\"]");
                  if (engInput && (!engInput.value || engInput.dataset.autoFilled === "true")) {
                    engInput.value = arabicToEnglish(e.target.value);
                    engInput.dataset.autoFilled = "true";
                  }
                }}
              />
              <Input name="name" label={ar ? "الاسم بالإنجليزية" : "Full Name"} required placeholder="Dr. Mohammed Al-Ahmadi"
                onChange={(e) => { e.currentTarget.dataset.autoFilled = "false"; }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select name="specialtyId" label={ar ? "التخصص" : "Specialty"} options={specOpts} placeholder={ar ? "اختر" : "Select"} required />
              <Input name="phone" type="tel" label={ar ? "الهاتف" : "Phone"} placeholder="+966 5x xxx xxxx" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input name="licenseNumber" label={ar ? "رقم الترخيص" : "License #"} />
              <Input name="exp" type="number" min="0" label={ar ? "سنوات الخبرة" : "Experience"} />
              <Input name="fee" type="number" min="0" label={ar ? "رسوم الكشف" : "Consult. Fee"} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Select name="days" label={ar ? "أيام العمل" : "Working Days"} options={daysOpts} placeholder={ar ? "اختر" : "Select"} />
              <Input name="from" type="time" label={ar ? "من" : "From"} defaultValue="08:00" />
              <Input name="to" type="time" label={ar ? "إلى" : "To"} defaultValue="16:00" />
            </div>
          </div>
          {/* Logo upload */}
          <div className="rounded-xl bg-slate-800/40 border border-[#2a3347] p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{ar ? "شعار الطبيب (اختياري)" : "Doctor Logo (optional)"}</p>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/20 text-2xl overflow-hidden">
                {logoPreview ? <img src={logoPreview} alt="logo" className="h-full w-full object-cover" /> : "🩺"}
              </div>
              <div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
                <button type="button" onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 hover:bg-white/10 transition-colors">
                  {ar ? "رفع صورة الشعار" : "Upload Logo"}
                </button>
                {logoPreview && <button type="button" onClick={() => setLogoPreview(null)}
                  className="mt-1 text-xs text-rose-400 hover:text-rose-300">{ar ? "حذف" : "Remove"}</button>}
              </div>
            </div>
          </div>

          {/* Clinic location */}
          <div className="rounded-xl bg-slate-800/40 border border-[#2a3347] p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{ar ? "موقع العيادة على الخريطة" : "Clinic Location on Map"}</p>
            <MapPicker
              lat={mapData.lat} lng={mapData.lng} address={mapData.address}
              locale={locale}
              onChange={(lat, lng, address) => setMapData({ lat, lng, address })}
            />
          </div>

          <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />{ar ? "حساب الدخول" : "Login Account"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input name="username" label={ar ? "اسم المستخدم" : "Username"} required error={errors.username} placeholder="dr.username" />
              <Input name="password" type="password" label={ar ? "كلمة المرور" : "Password"} required placeholder="••••••••" />
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal isOpen={editOpen} onClose={() => { setEditOpen(false); setEditDoctor(null); setErrors({}); }}
        title={ar ? "تعديل بيانات الطبيب" : "Edit Doctor"} size="xl"
        footer={<>
          <Button variant="secondary" onClick={() => { setEditOpen(false); setEditDoctor(null); }} disabled={loading}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="edit-form" loading={loading}>{ar ? "حفظ التعديلات" : "Save Changes"}</Button>
        </>}>
        <form id="edit-form" onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input name="nameAr" label={ar ? "الاسم بالعربية" : "الاسم بالعربية"} defaultValue={editDoctor?.nameAr} required />
            <Input name="name" label={ar ? "الاسم بالإنجليزية" : "Full Name"} defaultValue={editDoctor?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select name="specialtyId" label={ar ? "التخصص" : "Specialty"} options={specOpts} defaultValue={editDoctor?.specialtyId} required />
            <Input name="phone" type="tel" label={ar ? "الهاتف" : "Phone"} defaultValue={editDoctor?.phone ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="email" type="email" label={ar ? "البريد" : "Email"} defaultValue={editDoctor?.email ?? ""} />
            <Input name="licenseNumber" label={ar ? "رقم الترخيص" : "License #"} defaultValue={editDoctor?.licenseNumber ?? ""} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input name="exp" type="number" min="0" label={ar ? "سنوات الخبرة" : "Experience"} defaultValue={editDoctor?.experienceYears?.toString() ?? ""} />
            <Input name="fee" type="number" min="0" label={ar ? "رسوم الكشف" : "Fee"} defaultValue={editDoctor?.consultationFee?.toString() ?? ""} />
            <Select name="days" label={ar ? "أيام العمل" : "Working Days"} options={daysOpts} defaultValue={editDoctor?.workingDays ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="from" type="time" label={ar ? "من" : "From"} defaultValue={editDoctor?.workingHoursStart ?? "08:00"} />
            <Input name="to" type="time" label={ar ? "إلى" : "To"} defaultValue={editDoctor?.workingHoursEnd ?? "16:00"} />
          </div>
          {/* Logo in edit */}
          <div className="rounded-xl bg-slate-800/40 border border-[#2a3347] p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{ar ? "شعار الطبيب" : "Doctor Logo"}</p>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/20 overflow-hidden text-2xl">
                {logoPreview ?? (editDoctor as any)?.logoUrl ? <img src={logoPreview ?? (editDoctor as any)?.logoUrl} alt="logo" className="h-full w-full object-cover" /> : "🩺"}
              </div>
              <div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }} />
                <button type="button" onClick={() => logoInputRef.current?.click()}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition-colors">
                  {ar ? "تغيير الشعار" : "Change Logo"}
                </button>
              </div>
            </div>
          </div>
          {/* Map in edit */}
          <div className="rounded-xl bg-slate-800/40 border border-[#2a3347] p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{ar ? "موقع العيادة" : "Clinic Location"}</p>
            <MapPicker
              lat={(editDoctor as any)?.clinicLat ?? mapData.lat}
              lng={(editDoctor as any)?.clinicLng ?? mapData.lng}
              address={(editDoctor as any)?.clinicAddress ?? mapData.address}
              locale={locale}
              onChange={(lat, lng, address) => setMapData({ lat, lng, address })}
            />
          </div>
        </form>
      </Modal>

      {/* Create account modal */}
      <Modal isOpen={accOpen} onClose={() => { setAccOpen(false); setErrors({}); }}
        title={`${ar ? "إنشاء حساب لـ" : "Create account for"} ${ar ? selected?.nameAr : selected?.name}`}
        size="sm" footer={<>
          <Button variant="secondary" onClick={() => setAccOpen(false)} disabled={loading}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="acc-form" loading={loading}>{ar ? "إنشاء" : "Create"}</Button>
        </>}>
        <form id="acc-form" onSubmit={handleCreateAcc} className="space-y-3">
          <Input name="username" label={ar ? "اسم المستخدم" : "Username"} required error={errors.username} placeholder="dr.username" />
          <Input name="password" type="password" label={ar ? "كلمة المرور" : "Password"} required placeholder="••••••••" />
        </form>
      </Modal>

      {/* Reset password */}
      <Modal isOpen={pwdOpen} onClose={() => setPwdOpen(false)}
        title={`${ar ? "كلمة مرور جديدة لـ" : "New password for"} @${selected?.user?.username}`}
        size="sm" footer={<>
          <Button variant="secondary" onClick={() => setPwdOpen(false)} disabled={loading}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="pwd-form" loading={loading}>{ar ? "حفظ" : "Save"}</Button>
        </>}>
        <form id="pwd-form" onSubmit={handlePwd} className="space-y-3">
          <Input name="password" type="password" label={ar ? "كلمة المرور الجديدة" : "New Password"} required placeholder="••••••••" />
        </form>
      </Modal>

      {/* Secretary account */}
      <Modal isOpen={secOpen} onClose={() => { setSecOpen(false); setErrors({}); }}
        title={`${ar ? "إضافة سكرتير لـ" : "Add secretary for"} ${ar ? selected?.nameAr : selected?.name}`}
        size="sm" footer={<>
          <Button variant="secondary" onClick={() => setSecOpen(false)} disabled={loading}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="sec-form" loading={loading}>{ar ? "إنشاء" : "Create"}</Button>
        </>}>
        <form id="sec-form" onSubmit={handleSec} className="space-y-3">
          <Input name="name" label={ar ? "الاسم" : "Name"} required placeholder={ar ? "اسم السكرتير" : "Secretary name"} />
          <Input name="username" label={ar ? "اسم المستخدم" : "Username"} required error={errors.username} placeholder="secretary.name" />
          <Input name="password" type="password" label={ar ? "كلمة المرور" : "Password"} required placeholder="••••••••" />
        </form>
      </Modal>

      {/* Subscription modal */}
      <Modal isOpen={subOpen} onClose={() => setSubOpen(false)}
        title={`${ar ? "تحديد اشتراك" : "Set Subscription"} — ${ar ? selected?.nameAr : selected?.name}`}
        size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setSubOpen(false)} disabled={loading}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="sub-form" loading={loading}>{ar ? "حفظ" : "Save"}</Button>
        </>}>
        <form id="sub-form" onSubmit={async (e) => {
          e.preventDefault();
          if (!selected) return;
          setLoading(true);
          const fd = new FormData(e.currentTarget);
          const days = parseInt(fd.get("days") as string);
          const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
          await setDoctorSubscription(selected.id, expiry);
          // Send notification to doctor
          if (selected.user?.id) {
            await sendMessage("system", selected.user.id,
              ar ? `تم تحديث اشتراكك في النظام. تاريخ الانتهاء: ${expiry.toLocaleDateString("ar-SA")}`
                 : `Your subscription has been updated. Expiry: ${expiry.toLocaleDateString("en-US")}`);
          }
          setLoading(false);
          setSubOpen(false);
          showToast(ar ? "تم تحديث الاشتراك" : "Subscription updated");
          router.refresh();
        }} className="space-y-4">
          <Select name="days" label={ar ? "مدة الاشتراك" : "Subscription Duration"}
            options={[
              { value: "30", label: ar ? "شهر (30 يوم)" : "1 Month (30 days)" },
              { value: "90", label: ar ? "3 أشهر (90 يوم)" : "3 Months" },
              { value: "180", label: ar ? "6 أشهر (180 يوم)" : "6 Months" },
              { value: "365", label: ar ? "سنة (365 يوم)" : "1 Year" },
            ]} defaultValue="30" required />
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async () => { setLoading(true); await deleteDoctorAndAccount(deleteId!); setDeleteId(null); setLoading(false); router.refresh(); }}
        loading={loading}
        title={ar ? "حذف الطبيب وحسابه" : "Delete Doctor & Account"}
        message={ar ? "سيُحذف الطبيب وحساب دخوله نهائياً." : "Doctor and their account will be permanently deleted."} />

      {/* Doctor Detail Panel */}
      <Modal isOpen={detailOpen} onClose={() => { setDetailOpen(false); setDetailData(null); }}
        title={ar ? "تفاصيل الطبيب" : "Doctor Details"} size="lg">
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
          </div>
        ) : detailData?.doctor ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/20 text-2xl font-bold text-indigo-300">
                {detailData.doctor.name[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{ar ? detailData.doctor.nameAr : detailData.doctor.name}</h3>
                <p className="text-sm text-indigo-400">{ar ? detailData.doctor.specialty.nameAr : detailData.doctor.specialty.name}</p>
                {detailData.doctor.user && (
                  <p className="text-xs text-slate-500 mt-0.5">@{detailData.doctor.user.username}</p>
                )}
              </div>
              {/* Subscription badge */}
              {detailData.isSubscribed ? (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 border border-emerald-500/25 px-3 py-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle className="h-3.5 w-3.5" />{ar ? "مشترك" : "Subscribed"}
                </span>
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5" />{ar ? "غير مشترك" : "Not subscribed"}
                </span>
              )}
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: ar ? "الهاتف" : "Phone",      value: detailData.doctor.phone },
                { label: ar ? "الإيميل" : "Email",      value: detailData.doctor.email },
                { label: ar ? "الترخيص" : "License",    value: detailData.doctor.licenseNumber },
                { label: ar ? "الخبرة" : "Experience",  value: detailData.doctor.experienceYears ? `${detailData.doctor.experienceYears} ${ar ? "سنة" : "yrs"}` : null },
                { label: ar ? "الكشفية" : "Fee",        value: detailData.doctor.consultationFee ? `${detailData.doctor.consultationFee.toLocaleString()} ${ar ? "د.ع" : "IQD"}` : null },
                { label: ar ? "المواعيد" : "Appointments", value: String(detailData.totalAppointments) },
                { label: ar ? "المرضى" : "Patients",   value: String(detailData.doctor._count.patients) },
                { label: ar ? "العنوان" : "Address",    value: detailData.doctor.clinicAddress },
              ].filter(i => i.value).map((item) => (
                <div key={item.label} className="rounded-xl border border-white/8 bg-white/3 px-3 py-2">
                  <p className="text-[10px] text-slate-500">{item.label}</p>
                  <p className="text-white text-xs mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Subscription */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-3">
              <p className="text-xs font-semibold text-white">{ar ? "الاشتراك" : "Subscription"}</p>
              {detailData.subscription && (
                <p className="text-xs text-slate-400">
                  {ar ? "ينتهي: " : "Expires: "}
                  {new Date(detailData.subscription.expiresAt).toLocaleDateString(ar ? "ar-IQ" : "en-GB")}
                  {detailData.isSubscribed ? (
                    <span className="ms-2 text-emerald-400">✓ {ar ? "نشط" : "Active"}</span>
                  ) : (
                    <span className="ms-2 text-red-400">✗ {ar ? "منتهي" : "Expired"}</span>
                  )}
                </p>
              )}
              <div className="flex items-center gap-2">
                <select value={activateMonths} onChange={e => setActivateMonths(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#0c1121] px-3 py-2 text-xs text-white focus:outline-none">
                  {[["1", ar?"شهر":"1 Month"],["3","3 "+( ar?"أشهر":"Months")],["6","6 "+(ar?"أشهر":"Months")],["12", ar?"سنة":"1 Year"]].map(([v,l])=>(
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <Button size="sm" onClick={async () => {
                  if (!detailData.doctor) return;
                  setLoading(true);
                  await activateDoctorSubscription(detailData.doctor.id, parseInt(activateMonths));
                  const refreshed = await getDoctorFullDetails(detailData.doctor.id);
                  setDetailData(refreshed);
                  setLoading(false);
                  showToast(ar ? "تم تفعيل الاشتراك" : "Subscription activated");
                  router.refresh();
                }} loading={loading} className="gap-1.5 text-xs bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15">
                  <CheckCircle className="h-3.5 w-3.5" />{ar ? "تفعيل الاشتراك" : "Activate"}
                </Button>
              </div>
            </div>

            {/* Secretaries */}
            {detailData.secretaries.length > 0 && (
              <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                <p className="text-xs font-semibold text-white mb-2">{ar ? "السكرتيرون" : "Secretaries"}</p>
                <div className="space-y-1">
                  {detailData.secretaries.map(s => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg bg-white/3 px-3 py-2 text-xs">
                      <span className="text-white">{s.name}</span>
                      <span className={`font-mono ${s.isActive ? "text-emerald-400" : "text-red-400"}`}>@{s.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {(detailData.doctor.bioAr || detailData.doctor.bio) && (
              <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                <p className="text-xs font-semibold text-white mb-1.5">{ar ? "السيرة الذاتية" : "Bio"}</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {ar ? (detailData.doctor.bioAr ?? detailData.doctor.bio) : (detailData.doctor.bio ?? detailData.doctor.bioAr)}
                </p>
              </div>
            )}

            {/* Send message */}
            {detailData.doctor.user && (
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-2">
                <p className="text-xs font-semibold text-cyan-300">{ar ? "إرسال رسالة للطبيب" : "Send message to doctor"}</p>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const msg = fd.get("msg") as string;
                  if (!msg.trim()) return;
                  await sendMessage("system", detailData.doctor!.user!.id, msg);
                  (e.target as HTMLFormElement).reset();
                  showToast(ar ? "تم إرسال الرسالة" : "Message sent");
                }} className="flex gap-2">
                  <input name="msg" required
                    placeholder={ar ? "اكتب رسالتك..." : "Write your message..."}
                    className="flex-1 rounded-xl border border-white/10 bg-[#0c1121] px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none" />
                  <Button type="submit" size="sm" className="shrink-0 text-xs">{ar ? "إرسال" : "Send"}</Button>
                </form>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
