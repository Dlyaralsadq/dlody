"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  User, Clock, Banknote, MapPin,
  Camera, Check, Loader2, AlertCircle, ChevronDown, UserPlus,
  Crown, Building2, Palette, ShieldCheck,
} from "lucide-react";
import { arabicToEnglish } from "@/lib/transliterate";
import { createSecretaryForDoctor, getSecretariesForDoctorPortal, updateDoctorSettings } from "@/app/actions/doctorPortal";
import ThemeToggle from "@/components/ui/ThemeToggle";
import InfoTooltip from "@/components/ui/InfoTooltip";
import ContactVerifyPanel from "@/components/ui/ContactVerifyPanel";

const MapPicker = dynamic(() => import("@/components/ui/MapPicker"), { ssr: false });

interface Specialty { id: string; name: string; nameAr: string; }
interface Doctor {
  id: string;
  name: string;
  nameAr: string;
  bio: string | null;
  bioAr: string | null;
  services: string | null;
  announcement: string | null;
  specialtyId: string;
  phone: string | null;
  email: string | null;
  licenseNumber: string | null;
  experienceYears: number | null;
  consultationFee: number | null;
  workingDays: string | null;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  appointmentDuration: number | null;
  clinicAddress: string | null;
  clinicLat: number | null;
  clinicLng: number | null;
  logoUrl: string | null;
  showConsultationFee: boolean;
  recurringPatientsEnabled: boolean;
  specialty: Specialty;
}

const WORKING_DAYS = [
  { value: "sat-thu", ar: "السبت — الخميس", en: "Sat – Thu" },
  { value: "sun-thu", ar: "الأحد — الخميس", en: "Sun – Thu" },
  { value: "sat-wed", ar: "السبت — الأربعاء", en: "Sat – Wed" },
  { value: "mon-fri", ar: "الاثنين — الجمعة", en: "Mon – Fri" },
];

function SaveButton({ ar, saving, saved, onClick }: { ar: boolean; saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={saving}
      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-white transition disabled:opacity-50"
      style={{ background: saved ? "rgba(16,185,129,.8)" : "var(--indigo)", border: "1px solid rgba(255,255,255,.1)" }}>
      {saving
        ? <><Loader2 size={14} className="animate-spin" />{ar ? "جاري الحفظ..." : "Saving..."}</>
        : saved
        ? <><Check size={14} />{ar ? "تم الحفظ ✓" : "Saved ✓"}</>
        : ar ? "حفظ التغييرات" : "Save changes"}
    </button>
  );
}

export default function DoctorSettingsClient({
  doctor,
  specialties,
  locale,
  isSubscribed = false,
  secretaries: initialSecretaries = [],
  contactStatus,
}: {
  doctor: Doctor;
  specialties: Specialty[];
  locale: string;
  isSubscribed?: boolean;
  secretaries?: Array<{ id: string; username: string; name: string; isActive: boolean }>;
  contactStatus?: {
    email: string | null;
    phone: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
  } | null;
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
  const [services, setServices] = useState(doctor.services ?? "");
  const [announcement, setAnnouncement] = useState(doctor.announcement ?? "");
  const [specialtyId, setSpecialtyId] = useState(doctor.specialtyId);
  const [phone, setPhone] = useState(doctor.phone ?? "");
  const [email, setEmail] = useState(doctor.email ?? "");
  const [license, setLicense] = useState(doctor.licenseNumber ?? "");
  const [exp, setExp] = useState(String(doctor.experienceYears ?? ""));
  const [fee, setFee] = useState(String(doctor.consultationFee ?? ""));
  const [days, setDays] = useState(doctor.workingDays ?? "");
  const [from, setFrom] = useState(doctor.workingHoursStart ?? "");
  const [to, setTo] = useState(doctor.workingHoursEnd ?? "");
  const [apptDuration, setApptDuration] = useState(String(doctor.appointmentDuration ?? 30));
  const [logo, setLogo] = useState(doctor.logoUrl ?? "");
  const [showFee, setShowFee] = useState(doctor.showConsultationFee ?? true);
  const [recurringEnabled, setRecurringEnabled] = useState(doctor.recurringPatientsEnabled ?? true);
  const [mapData, setMapData] = useState({
    lat: doctor.clinicLat ?? null as number | null,
    lng: doctor.clinicLng ?? null as number | null,
    address: doctor.clinicAddress ?? "",
  });
  const [showMap, setShowMap] = useState(false);

  const [secretaries, setSecretaries] = useState(initialSecretaries);
  const [secName, setSecName] = useState("");
  const [secUsername, setSecUsername] = useState("");
  const [secPassword, setSecPassword] = useState("");
  const [secLoading, setSecLoading] = useState(false);
  const [secError, setSecError] = useState("");
  const [secSuccess, setSecSuccess] = useState(false);

  const [activeSection, setActiveSection] = useState<
    "profile" | "clinic" | "subscription" | "secretary" | "verify" | "appearance" | null
  >(null);

  function toggle(id: typeof activeSection) {
    setActiveSection(prev => prev === id ? null : id);
  }

  const sections = [
    { id: "profile" as const, icon: User, label: ar ? "الملف الشخصي" : "Profile" },
    { id: "clinic" as const, icon: Building2, label: ar ? "العيادة" : "Clinic" },
    { id: "verify" as const, icon: ShieldCheck, label: ar ? "تأكيد التواصل" : "Verify contact" },
    { id: "subscription" as const, icon: Crown, label: ar ? "الاشتراك والميزات" : "Subscription" },
    ...(isSubscribed ? [{ id: "secretary" as const, icon: UserPlus, label: ar ? "السكرتير" : "Secretary" }] : []),
    { id: "appearance" as const, icon: Palette, label: ar ? "المظهر" : "Appearance" },
  ];

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
        services: services || null,
        announcement: announcement || null,
        specialtyId,
        phone: phone || null,
        email: email || null,
        licenseNumber: license || null,
        experienceYears: exp ? parseInt(exp) : null,
        consultationFee: fee ? parseFloat(fee) : null,
        workingDays: days || null,
        workingHoursStart: from || null,
        workingHoursEnd: to || null,
        appointmentDuration: apptDuration ? parseInt(apptDuration) : 30,
        clinicAddress: mapData.address || null,
        clinicLat: mapData.lat ?? null,
        clinicLng: mapData.lng ?? null,
        showConsultationFee: showFee,
        recurringPatientsEnabled: recurringEnabled,
      };
      if (logo && logo.length < 400000) payload.logoUrl = logo;

      const result = await updateDoctorSettings(doctor.id, payload);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        router.refresh();
      } else {
        const emailErrors: Record<string, string> = {
          unreal_email: ar ? "هذا البريد غير حقيقي أو لا يستقبل الرسائل" : "This email is not a real inbox",
          invalid_email: ar ? "بريد غير صالح" : "Invalid email",
          email_check_failed: ar ? "تعذر التحقق من نطاق البريد. حاول مرة أخرى" : "Could not check this email domain. Try again",
          email_taken: ar ? "البريد مستخدم مسبقاً" : "Email already in use",
        };
        setError(emailErrors[result.error ?? ""] ?? (ar ? "حدث خطأ أثناء الحفظ" : "An error occurred while saving"));
      }
    } catch {
      setError(ar ? "تعذّر الاتصال بالخادم" : "Could not reach the server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl pb-10" dir={ar ? "rtl" : "ltr"}>
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>
          {ar ? "الإعدادات" : "Settings"}
        </h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl mb-4 px-4 py-3 text-sm text-rose-400"
          style={{ border: "1px solid rgba(244,63,94,.2)", background: "rgba(244,63,94,.06)" }}>
          <AlertCircle size={15} />{error}
        </div>
      )}

      <div className="space-y-2">
        {sections.map(({ id, icon: Icon, label }) => {
          const open = activeSection === id;
          return (
            <div key={id} className="rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${open ? "rgba(99,102,241,.4)" : "var(--border)"}`, transition: "border-color .2s" }}>
              {/* Header */}
              <button type="button" onClick={() => toggle(id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-start"
                style={{ background: open ? "rgba(99,102,241,.07)" : "transparent" }}>
                <Icon size={16} style={{ color: open ? "var(--indigo-l)" : "var(--text-3)" }} />
                <span className="flex-1 text-sm font-medium" style={{ color: open ? "var(--text-1)" : "var(--text-2)" }}>{label}</span>
                <ChevronDown size={14} style={{ color: "var(--text-3)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }} />
              </button>

              {/* Content */}
              {open && (
                <div className="px-4 pb-5 pt-3 space-y-4" style={{ borderTop: "1px solid var(--border)" }}>

                  {/* ── Profile ── */}
                  {id === "profile" && (<>
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl overflow-hidden text-2xl cursor-pointer"
                        style={{ background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.2)" }}
                        onClick={() => logoRef.current?.click()}>
                        {logo ? <img src={logo} alt="logo" className="h-full w-full object-cover" /> : "🩺"}
                      </div>
                      <div className="space-y-1">
                        <button type="button" onClick={() => logoRef.current?.click()}
                          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium"
                          style={{ border: "1px solid var(--border)", color: "var(--text-1)" }}>
                          <Camera size={12} />{ar ? "رفع صورة" : "Upload"}
                        </button>
                        {logo && (
                          <button type="button" onClick={() => setLogo("")}
                            className="text-[11px] text-rose-400">{ar ? "حذف" : "Remove"}</button>
                        )}
                      </div>
                      <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">{ar ? "الاسم بالعربي" : "Arabic name"}</label>
                        <input value={nameAr} onChange={(e) => handleNameAr(e.target.value)} dir="rtl" className="form-input" placeholder="د. أحمد" />
                      </div>
                      <div>
                        <label className="form-label">{ar ? "الاسم بالإنجليزي" : "English name"}</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} dir="ltr" className="form-input" placeholder="Dr. Ahmed" />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">{ar ? "التخصص" : "Specialty"}</label>
                      <div className="relative">
                        <select value={specialtyId} onChange={(e) => setSpecialtyId(e.target.value)} className="form-input appearance-none pe-8">
                          {specialties.map((s) => <option key={s.id} value={s.id}>{ar ? s.nameAr : s.name}</option>)}
                        </select>
                        <ChevronDown size={12} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">{ar ? "نبذة (عربي)" : "Bio (Arabic)"}</label>
                      <textarea value={bioAr} onChange={(e) => setBioAr(e.target.value)} rows={2} dir="rtl" className="form-input resize-none" placeholder={ar ? "نبذة مختصرة..." : "Brief bio..."} />
                    </div>
                    <div>
                      <label className="form-label">{ar ? "نبذة (إنجليزي)" : "Bio (English)"}</label>
                      <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} dir="ltr" className="form-input resize-none" placeholder="Brief bio..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">{ar ? "الهاتف" : "Phone"}</label>
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" dir="ltr" className="form-input" placeholder="07XXXXXXXXX" />
                      </div>
                      <div>
                        <label className="form-label">{ar ? "البريد" : "Email"}</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" dir="ltr" className="form-input" placeholder="dr@email.com" />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">{ar ? "رقم الترخيص" : "License No."}</label>
                      <input value={license} onChange={(e) => setLicense(e.target.value)} dir="ltr" className="form-input" placeholder="IQ-MED-12345" />
                    </div>
                    <SaveButton ar={ar} saving={saving} saved={saved} onClick={handleSave} />
                  </>)}

                  {/* ── Clinic ── */}
                  {id === "clinic" && (<>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">{ar ? "سنوات الخبرة" : "Experience"}</label>
                        <input value={exp} onChange={(e) => setExp(e.target.value)} type="number" min="0" max="60" className="form-input" placeholder="10" />
                      </div>
                      <div>
                        <label className="form-label">{ar ? "سعر الكشفية (د.ع)" : "Fee (IQD)"}</label>
                        <input value={fee} onChange={(e) => setFee(e.target.value)} type="number" min="0" className="form-input" placeholder="50000" />
                      </div>
                    </div>
                    <label className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 cursor-pointer"
                      style={{ border: "1px solid var(--border)" }}>
                      <span className="text-sm flex items-center gap-1" style={{ color: "var(--text-1)" }}>
                        {ar ? "إظهار السعر للمرضى" : "Show fee to patients"}
                        <InfoTooltip locale={locale} text={ar ? "عند الإيقاف لن يرى المرضى السعر" : "When off, patients won't see the fee"} />
                      </span>
                      <input type="checkbox" checked={showFee} onChange={(e) => setShowFee(e.target.checked)} className="h-4 w-4 rounded accent-indigo-500" />
                    </label>
                    <div>
                      <label className="form-label">{ar ? "خدمات الصفحة العامة" : "Services on your public page"}</label>
                      <textarea value={services} onChange={(e) => setServices(e.target.value)} rows={3} className="form-input resize-none" placeholder={ar ? "سطر لكل خدمة" : "One service per line"} />
                    </div>
                    <div>
                      <label className="form-label">{ar ? "تنبيه أعلى الصفحة" : "Notice at the top of the page"}</label>
                      <input value={announcement} onChange={(e) => setAnnouncement(e.target.value)} className="form-input" placeholder={ar ? "مثال: الحجوزات متاحة هذا الأسبوع" : "Example: bookings are open this week"} />
                    </div>
                    <div>
                      <label className="form-label">{ar ? "أيام العمل" : "Working days"}</label>
                      <div className="relative">
                        <select value={days} onChange={(e) => setDays(e.target.value)} className="form-input appearance-none pe-8">
                          <option value="">{ar ? "اختر" : "Choose"}</option>
                          {WORKING_DAYS.map((d) => <option key={d.value} value={d.value}>{ar ? d.ar : d.en}</option>)}
                        </select>
                        <ChevronDown size={12} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">{ar ? "من" : "From"}</label>
                        <input value={from} onChange={(e) => setFrom(e.target.value)} type="time" className="form-input [color-scheme:dark]" />
                      </div>
                      <div>
                        <label className="form-label">{ar ? "إلى" : "To"}</label>
                        <input value={to} onChange={(e) => setTo(e.target.value)} type="time" className="form-input [color-scheme:dark]" />
                      </div>
                    </div>
                    <div>
                      <label className="form-label flex items-center gap-1">
                        {ar ? "مدة الموعد" : "Appointment duration"}
                        <InfoTooltip locale={locale} text={ar ? "تُستخدم لحجب الأوقات تلقائياً" : "Used to auto-block time slots"} />
                      </label>
                      <div className="relative">
                        <select value={apptDuration} onChange={(e) => setApptDuration(e.target.value)} className="form-input appearance-none pe-8">
                          {[10, 15, 20, 30, 45, 60, 90].map((d) => <option key={d} value={d}>{d} {ar ? "د" : "min"}</option>)}
                        </select>
                        <ChevronDown size={12} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="form-label mb-0">{ar ? "موقع العيادة" : "Clinic location"}</label>
                        <button type="button" onClick={() => setShowMap(!showMap)} className="text-xs text-indigo-400">
                          {showMap ? (ar ? "إخفاء" : "Hide") : (ar ? "تحديد" : "Set location")}
                        </button>
                      </div>
                      {mapData.address && (
                        <p className="text-xs flex items-start gap-1.5 mb-2" style={{ color: "var(--text-2)" }}>
                          <MapPin size={11} className="text-indigo-400 mt-0.5 shrink-0" />{mapData.address}
                        </p>
                      )}
                      {showMap && (
                        <MapPicker lat={mapData.lat} lng={mapData.lng ?? undefined}
                          address={mapData.address} locale={locale} autoLocate={!mapData.lat}
                          onChange={(lat, lng, address) => setMapData({ lat, lng, address })} />
                      )}
                    </div>
                    <SaveButton ar={ar} saving={saving} saved={saved} onClick={handleSave} />
                  </>)}

                  {/* ── Verify ── */}
                  {id === "verify" && (
                    <ContactVerifyPanel locale={locale}
                      initialEmail={contactStatus?.email ?? email}
                      initialPhone={contactStatus?.phone ?? phone}
                      emailVerified={contactStatus?.emailVerified ?? false}
                      phoneVerified={contactStatus?.phoneVerified ?? false} />
                  )}

                  {/* ── Subscription ── */}
                  {id === "subscription" && (<>
                    {!isSubscribed ? (
                      <div className="rounded-xl px-4 py-3" style={{ border: "1px solid rgba(245,158,11,.2)", background: "rgba(245,158,11,.06)" }}>
                        <p className="text-sm text-amber-300">{ar ? "أنت على الخطة المجانية — اشترك للحصول على السكرتير والرسائل" : "Free plan — subscribe for secretary & messaging"}</p>
                      </div>
                    ) : (
                      <div className="rounded-xl px-4 py-3" style={{ border: "1px solid rgba(16,185,129,.2)", background: "rgba(16,185,129,.06)" }}>
                        <p className="text-sm text-emerald-300">{ar ? "اشتراكك نشط ✓" : "Subscription active ✓"}</p>
                      </div>
                    )}
                    <label className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 cursor-pointer"
                      style={{ border: "1px solid var(--border)" }}>
                      <span className="text-sm flex items-center gap-1" style={{ color: "var(--text-1)" }}>
                        {ar ? "ميزة المرضى الدائمين" : "Recurring patients feature"}
                        <InfoTooltip locale={locale} text={ar ? "عند الإيقاف تُخفى قائمة المرضى الدائمين" : "When off, recurring patients menu is hidden"} />
                      </span>
                      <input type="checkbox" checked={recurringEnabled} onChange={(e) => setRecurringEnabled(e.target.checked)} className="h-4 w-4 rounded accent-indigo-500" />
                    </label>
                  </>)}

                  {/* ── Secretary ── */}
                  {id === "secretary" && isSubscribed && (<>
                    {secretaries.length > 0 && (
                      <div className="space-y-2">
                        {secretaries.map((s) => (
                          <div key={s.id} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                            style={{ border: "1px solid var(--border)" }}>
                            <div>
                              <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>{s.name}</p>
                              <p className="text-[10px] font-mono" style={{ color: "var(--text-3)" }}>@{s.username}</p>
                            </div>
                            <span className={`text-[10px] ${s.isActive ? "text-emerald-400" : "text-rose-400"}`}>
                              {s.isActive ? (ar ? "نشط" : "Active") : (ar ? "معطل" : "Disabled")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="space-y-2.5 pt-2" style={{ borderTop: secretaries.length > 0 ? "1px solid var(--border)" : "none" }}>
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>{ar ? "إضافة سكرتير جديد:" : "Add new secretary:"}</p>
                      {secError && <p className="text-xs text-rose-400">{secError}</p>}
                      {secSuccess && <p className="text-xs text-emerald-400">{ar ? "تم الإضافة ✓" : "Added ✓"}</p>}
                      <input value={secName} onChange={(e) => setSecName(e.target.value)} placeholder={ar ? "الاسم الكامل" : "Full name"} className="form-input" />
                      <input value={secUsername} onChange={(e) => setSecUsername(e.target.value)} placeholder={ar ? "اسم المستخدم" : "Username"} dir="ltr" className="form-input" />
                      <input value={secPassword} onChange={(e) => setSecPassword(e.target.value)} type="password" placeholder={ar ? "كلمة المرور" : "Password"} className="form-input" />
                      <button type="button" disabled={secLoading}
                        onClick={async () => {
                          if (!secName || !secUsername || !secPassword) { setSecError(ar ? "جميع الحقول مطلوبة" : "All fields required"); return; }
                          setSecLoading(true); setSecError("");
                          const r = await createSecretaryForDoctor(doctor.id, { name: secName, username: secUsername, password: secPassword });
                          setSecLoading(false);
                          if (r.success) {
                            setSecSuccess(true); setSecName(""); setSecUsername(""); setSecPassword("");
                            const updated = await getSecretariesForDoctorPortal(doctor.id);
                            setSecretaries(updated);
                            setTimeout(() => setSecSuccess(false), 3000);
                          } else {
                            setSecError(r.error === "username_taken" ? (ar ? "اسم المستخدم محجوز" : "Username taken") : (ar ? "حدث خطأ" : "Error"));
                          }
                        }}
                        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition disabled:opacity-50"
                        style={{ border: "1px solid rgba(99,102,241,.3)", background: "rgba(99,102,241,.08)", color: "var(--indigo-l)" }}>
                        {secLoading
                          ? <><Loader2 size={13} className="animate-spin" />{ar ? "جاري الإضافة..." : "Adding..."}</>
                          : <><UserPlus size={13} />{ar ? "إضافة سكرتير" : "Add secretary"}</>}
                      </button>
                    </div>
                  </>)}

                  {/* ── Appearance ── */}
                  {id === "appearance" && <ThemeToggle locale={locale} />}

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
