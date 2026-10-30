"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  User, Phone, Stethoscope, Clock, Banknote, MapPin,
  Camera, Check, Loader2, AlertCircle, ChevronDown, UserPlus, Trash2
} from "lucide-react";
import { arabicToEnglish } from "@/lib/transliterate";
import { createSecretaryForDoctor, getSecretariesForDoctorPortal, updateDoctorSettings } from "@/app/actions/doctorPortal";

const MapPicker = dynamic(() => import("@/components/ui/MapPicker"), { ssr: false });

interface Specialty { id: string; name: string; nameAr: string; }
interface Doctor {
  id: string;
  name: string;
  nameAr: string;
  bio: string | null;
  bioAr: string | null;
  specialtyId: string;
  phone: string | null;
  email: string | null;
  licenseNumber: string | null;
  experienceYears: number | null;
  consultationFee: number | null;
  workingDays: string | null;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  clinicAddress: string | null;
  clinicLat: number | null;
  clinicLng: number | null;
  logoUrl: string | null;
  specialty: Specialty;
}

const WORKING_DAYS = [
  { value: "sat-thu", ar: "السبت — الخميس", en: "Sat – Thu" },
  { value: "sun-thu", ar: "الأحد — الخميس", en: "Sun – Thu" },
  { value: "sat-wed", ar: "السبت — الأربعاء", en: "Sat – Wed" },
  { value: "mon-fri", ar: "الاثنين — الجمعة", en: "Mon – Fri" },
];

export default function DoctorSettingsClient({
  doctor,
  specialties,
  locale,
  isSubscribed = false,
  secretaries: initialSecretaries = [],
}: {
  doctor: Doctor;
  specialties: Specialty[];
  locale: string;
  isSubscribed?: boolean;
  secretaries?: Array<{ id: string; username: string; name: string; isActive: boolean }>;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const logoRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [nameAr, setNameAr] = useState(doctor.nameAr);
  const [name, setName] = useState(doctor.name);
  const [bioAr, setBioAr] = useState(doctor.bioAr ?? "");
  const [bio, setBio] = useState(doctor.bio ?? "");
  const [specialtyId, setSpecialtyId] = useState(doctor.specialtyId);
  const [phone, setPhone] = useState(doctor.phone ?? "");
  const [email, setEmail] = useState(doctor.email ?? "");
  const [license, setLicense] = useState(doctor.licenseNumber ?? "");
  const [exp, setExp] = useState(String(doctor.experienceYears ?? ""));
  const [fee, setFee] = useState(String(doctor.consultationFee ?? ""));
  const [days, setDays] = useState(doctor.workingDays ?? "");
  const [from, setFrom] = useState(doctor.workingHoursStart ?? "");
  const [to, setTo] = useState(doctor.workingHoursEnd ?? "");
  const [logo, setLogo] = useState(doctor.logoUrl ?? "");
  const [mapData, setMapData] = useState({
    lat: doctor.clinicLat ?? null as number | null,
    lng: doctor.clinicLng ?? null as number | null,
    address: doctor.clinicAddress ?? "",
  });
  const [showMap, setShowMap] = useState(false);
  // Secretary management
  const [secretaries, setSecretaries] = useState(initialSecretaries);
  const [secName, setSecName] = useState("");
  const [secUsername, setSecUsername] = useState("");
  const [secPassword, setSecPassword] = useState("");
  const [secLoading, setSecLoading] = useState(false);
  const [secError, setSecError] = useState("");
  const [secSuccess, setSecSuccess] = useState(false);

  function handleNameAr(v: string) {
    setNameAr(v);
    const eng = arabicToEnglish(v);
    if (eng) setName(eng);
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        name: name || null,
        nameAr: nameAr || null,
        bio: bio || null,
        bioAr: bioAr || null,
        specialtyId,
        phone: phone || null,
        email: email || null,
        licenseNumber: license || null,
        experienceYears: exp ? parseInt(exp) : null,
        consultationFee: fee ? parseFloat(fee) : null,
        workingDays: days || null,
        workingHoursStart: from || null,
        workingHoursEnd: to || null,
        clinicAddress: mapData.address || null,
        clinicLat: mapData.lat ?? null,
        clinicLng: mapData.lng ?? null,
      };
      if (logo && logo.length < 400000) payload.logoUrl = logo;

      const result = await updateDoctorSettings(doctor.id, payload);

      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        router.refresh();
      } else {
        setError(ar ? "حدث خطأ أثناء الحفظ" : "An error occurred while saving");
      }
    } catch {
      setError(ar ? "تعذّر الاتصال بالخادم" : "Could not reach the server");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-white/10 bg-[#0c1121] px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50";
  const labelCls = "block text-xs text-white/40 mb-1.5";

  return (
    <div className="max-w-2xl space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-bold text-white">
          {ar ? "إعدادات الملف الشخصي" : "Profile Settings"}
        </h1>
        <p className="text-sm text-white/30 mt-1">
          {ar ? "بياناتك تظهر للمرضى على الخريطة" : "Your info is visible to patients on the map"}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* ── Logo ── */}
      <section className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Camera size={15} className="text-indigo-400" />
          {ar ? "الصورة / شعار العيادة" : "Photo / Clinic Logo"}
        </h2>
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-600/15 border border-indigo-500/20 overflow-hidden text-3xl cursor-pointer"
            onClick={() => logoRef.current?.click()}>
            {logo
              ? <img src={logo} alt="logo" className="h-full w-full object-cover" />
              : "🩺"}
          </div>
          <div>
            <button type="button" onClick={() => logoRef.current?.click()}
              className="flex items-center gap-2 rounded-xl bg-white/8 border border-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/12 transition">
              <Camera size={13} />
              {ar ? "رفع صورة" : "Upload photo"}
            </button>
            {logo && (
              <button type="button" onClick={() => setLogo("")}
                className="mt-2 flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition">
                {ar ? "حذف الصورة" : "Remove photo"}
              </button>
            )}
          </div>
        </div>
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
      </section>

      {/* ── Name & Specialty ── */}
      <section className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <User size={15} className="text-indigo-400" />
          {ar ? "الاسم والتخصص" : "Name & Specialty"}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{ar ? "الاسم بالعربي *" : "Arabic name *"}</label>
            <input value={nameAr} onChange={(e) => handleNameAr(e.target.value)}
              dir="rtl" className={inputCls} placeholder="د. أحمد محمد" />
          </div>
          <div>
            <label className={labelCls}>{ar ? "الاسم بالإنجليزي" : "English name"}</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              dir="ltr" className={inputCls} placeholder="Dr. Ahmed" />
          </div>
        </div>
        <div>
          <label className={labelCls}>{ar ? "التخصص *" : "Specialty *"}</label>
          <div className="relative">
            <select value={specialtyId} onChange={(e) => setSpecialtyId(e.target.value)}
              className={`${inputCls} appearance-none pe-8`}>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>{ar ? s.nameAr : s.name}</option>
              ))}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-white/30" />
          </div>
        </div>
        <div>
          <label className={labelCls}>{ar ? "نبذة تعريفية (عربي)" : "Bio (Arabic)"}</label>
          <textarea value={bioAr} onChange={(e) => setBioAr(e.target.value)}
            rows={2} dir="rtl" className={`${inputCls} resize-none`}
            placeholder={ar ? "نبذة مختصرة عنك..." : "Brief bio..."} />
        </div>
        <div>
          <label className={labelCls}>{ar ? "نبذة تعريفية (إنجليزي)" : "Bio (English)"}</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)}
            rows={2} dir="ltr" className={`${inputCls} resize-none`}
            placeholder="Brief bio in English..." />
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Phone size={15} className="text-indigo-400" />
          {ar ? "معلومات التواصل" : "Contact Info"}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{ar ? "رقم الهاتف" : "Phone"}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              type="tel" dir="ltr" className={inputCls} placeholder="07XXXXXXXXX" />
          </div>
          <div>
            <label className={labelCls}>{ar ? "البريد الإلكتروني" : "Email"}</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)}
              type="email" dir="ltr" className={inputCls} placeholder="dr@email.com" />
          </div>
        </div>
        <div>
          <label className={labelCls}>{ar ? "رقم الترخيص" : "License number"}</label>
          <input value={license} onChange={(e) => setLicense(e.target.value)}
            dir="ltr" className={inputCls} placeholder="IQ-MED-12345" />
        </div>
      </section>

      {/* ── Experience & Fee ── */}
      <section className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Banknote size={15} className="text-indigo-400" />
          {ar ? "الخبرة والأتعاب" : "Experience & Fees"}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{ar ? "سنوات الخبرة" : "Years of experience"}</label>
            <input value={exp} onChange={(e) => setExp(e.target.value)}
              type="number" min="0" max="60" className={inputCls} placeholder="10" />
          </div>
          <div>
            <label className={labelCls}>{ar ? "سعر الكشفية (د.ع)" : "Consultation fee (IQD)"}</label>
            <input value={fee} onChange={(e) => setFee(e.target.value)}
              type="number" min="0" className={inputCls} placeholder="50000" />
          </div>
        </div>
      </section>

      {/* ── Hours ── */}
      <section className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock size={15} className="text-indigo-400" />
          {ar ? "ساعات العمل" : "Working Hours"}
        </h2>
        <div>
          <label className={labelCls}>{ar ? "أيام العمل" : "Working days"}</label>
          <div className="relative">
            <select value={days} onChange={(e) => setDays(e.target.value)}
              className={`${inputCls} appearance-none pe-8`}>
              <option value="">{ar ? "اختر الأيام" : "Choose days"}</option>
              {WORKING_DAYS.map((d) => (
                <option key={d.value} value={d.value}>{ar ? d.ar : d.en}</option>
              ))}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-white/30" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{ar ? "من" : "From"}</label>
            <input value={from} onChange={(e) => setFrom(e.target.value)}
              type="time" className={`${inputCls} [color-scheme:dark]`} />
          </div>
          <div>
            <label className={labelCls}>{ar ? "إلى" : "To"}</label>
            <input value={to} onChange={(e) => setTo(e.target.value)}
              type="time" className={`${inputCls} [color-scheme:dark]`} />
          </div>
        </div>
      </section>

      {/* ── Location ── */}
      <section className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <MapPin size={15} className="text-indigo-400" />
            {ar ? "موقع العيادة على الخريطة" : "Clinic Location on Map"}
          </h2>
          <button type="button" onClick={() => setShowMap(!showMap)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition">
            {showMap ? (ar ? "إخفاء الخريطة" : "Hide map") : (ar ? "تحديد الموقع" : "Set location")}
          </button>
        </div>

        {mapData.address && (
          <p className="flex items-start gap-2 text-xs text-white/60">
            <MapPin size={12} className="text-indigo-400 mt-0.5 shrink-0" />
            {mapData.address}
          </p>
        )}

        {showMap && (
          <MapPicker
            lat={mapData.lat}
            lng={mapData.lng ?? undefined}
            address={mapData.address}
            locale={locale}
            autoLocate={!mapData.lat}
            onChange={(lat, lng, address) => setMapData({ lat, lng, address })}
          />
        )}
      </section>

      {/* ── Secretary management (subscribed only) ── */}
      {isSubscribed && (
        <section className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <UserPlus size={15} className="text-indigo-400" />
            {ar ? "إدارة السكرتير" : "Secretary Management"}
          </h2>

          {/* Existing secretaries */}
          {secretaries.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-white/40">{ar ? "السكرتيرون الحاليون:" : "Current secretaries:"}</p>
              {secretaries.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-white">{s.name}</p>
                    <p className="text-[10px] text-white/40 font-mono">@{s.username}</p>
                  </div>
                  <span className={`text-[10px] ${s.isActive ? "text-emerald-400" : "text-red-400"}`}>
                    {s.isActive ? (ar ? "نشط" : "Active") : (ar ? "معطل" : "Disabled")}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Add secretary form */}
          <div className="space-y-3 border-t border-white/8 pt-4">
            <p className="text-xs text-white/40">{ar ? "إضافة سكرتير جديد:" : "Add new secretary:"}</p>
            {secError && <p className="text-xs text-rose-400">{secError}</p>}
            {secSuccess && <p className="text-xs text-emerald-400">{ar ? "تم إضافة السكرتير بنجاح ✓" : "Secretary added successfully ✓"}</p>}
            <div className="grid grid-cols-1 gap-2.5">
              <input value={secName} onChange={(e) => setSecName(e.target.value)}
                placeholder={ar ? "الاسم الكامل" : "Full name"}
                className={inputCls} />
              <input value={secUsername} onChange={(e) => setSecUsername(e.target.value)}
                placeholder={ar ? "اسم المستخدم" : "Username"} dir="ltr"
                className={inputCls} />
              <input value={secPassword} onChange={(e) => setSecPassword(e.target.value)}
                type="password" placeholder={ar ? "كلمة المرور" : "Password"}
                className={inputCls} />
            </div>
            <button type="button" disabled={secLoading}
              onClick={async () => {
                if (!secName || !secUsername || !secPassword) {
                  setSecError(ar ? "جميع الحقول مطلوبة" : "All fields required");
                  return;
                }
                setSecLoading(true); setSecError("");
                const r = await createSecretaryForDoctor(doctor.id, { name: secName, username: secUsername, password: secPassword });
                setSecLoading(false);
                if (r.success) {
                  setSecSuccess(true);
                  setSecName(""); setSecUsername(""); setSecPassword("");
                  const updated = await getSecretariesForDoctorPortal(doctor.id);
                  setSecretaries(updated);
                  setTimeout(() => setSecSuccess(false), 3000);
                } else {
                  setSecError(r.error === "username_taken" ? (ar ? "اسم المستخدم محجوز" : "Username already taken") : (ar ? "حدث خطأ" : "Error"));
                }
              }}
              className="flex items-center gap-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 px-4 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25 transition disabled:opacity-50"
            >
              {secLoading
                ? <><Loader2 size={13} className="animate-spin" />{ar ? "جاري الإضافة..." : "Adding..."}</>
                : <><UserPlus size={13} />{ar ? "إضافة سكرتير" : "Add secretary"}</>
              }
            </button>
          </div>
        </section>
      )}

      {/* ── Save button ── */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-bold text-white shadow-lg hover:opacity-90 disabled:opacity-50 transition"
      >
        {saving
          ? <><Loader2 size={15} className="animate-spin" />{ar ? "جاري الحفظ..." : "Saving..."}</>
          : saved
          ? <><Check size={15} />{ar ? "تم الحفظ ✓" : "Saved ✓"}</>
          : ar ? "حفظ التغييرات" : "Save changes"
        }
      </button>
    </div>
  );
}
