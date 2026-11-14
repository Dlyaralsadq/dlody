"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  User, Clock, Banknote, MapPin,
  Camera, Check, Loader2, AlertCircle, ChevronDown, UserPlus,
  Crown, Building2, Palette, ShieldCheck, Navigation,
} from "lucide-react";
import { arabicToEnglish } from "@/lib/transliterate";
import { createSecretaryForDoctor, getSecretariesForDoctorPortal, updateDoctorSettings } from "@/app/actions/doctorPortal";
import ThemeToggle from "@/components/ui/ThemeToggle";
import InfoTooltip from "@/components/ui/InfoTooltip";
import ContactVerifyPanel from "@/components/ui/ContactVerifyPanel";

const MapPicker = dynamic(() => import("@/components/ui/MapPicker"), { ssr: false });

interface Specialty { id: string; name: string; nameAr: string; }
interface Doctor {
  id: string; name: string; nameAr: string;
  bio: string | null; bioAr: string | null;
  services: string | null; announcement: string | null;
  specialtyId: string; phone: string | null; email: string | null;
  licenseNumber: string | null; experienceYears: number | null;
  consultationFee: number | null; workingDays: string | null;
  workingHoursStart: string | null; workingHoursEnd: string | null;
  appointmentDuration: number | null; clinicAddress: string | null;
  clinicLat: number | null; clinicLng: number | null;
  logoUrl: string | null; showConsultationFee: boolean;
  recurringPatientsEnabled: boolean; specialty: Specialty;
}

const WORKING_DAYS = [
  { value: "sat-thu", ar: "السبت — الخميس", en: "Sat – Thu" },
  { value: "sun-thu", ar: "الأحد — الخميس", en: "Sun – Thu" },
  { value: "sat-wed", ar: "السبت — الأربعاء", en: "Sat – Wed" },
  { value: "mon-fri", ar: "الاثنين — الجمعة", en: "Mon – Fri" },
];

/* ── Shared save button ── */
function SaveButton({ ar, saving, saved, onClick }: { ar: boolean; saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white w-full transition disabled:opacity-50"
      style={{
        background: saved ? "rgba(16,185,129,.85)" : "linear-gradient(135deg,#4f46e5,#6366f1)",
        boxShadow: saved ? "none" : "0 2px 12px rgba(99,102,241,.3)",
      }}
    >
      {saving
        ? <><Loader2 size={15} className="animate-spin" />{ar ? "جاري الحفظ..." : "Saving..."}</>
        : saved
          ? <><Check size={15} />{ar ? "تم الحفظ ✓" : "Saved ✓"}</>
          : ar ? "حفظ التغييرات" : "Save changes"}
    </button>
  );
}

/* ── Shared field wrapper ── */
function FieldCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "var(--bg-card-raised)", borderBottom: "1px solid var(--border)" }}
      >
        <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>{title}</p>
        {hint && <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{hint}</p>}
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

/* ── Toggle row ── */
function ToggleRow({ label, checked, onChange, hint, locale }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string; locale: string }) {
  return (
    <label
      className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-colors"
      style={{ border: "1px solid var(--border)" }}
    >
      <span className="text-sm flex items-center gap-1.5" style={{ color: "var(--text-1)" }}>
        {label}
        {hint && <InfoTooltip locale={locale} text={hint} />}
      </span>
      <div
        onClick={() => onChange(!checked)}
        className="relative h-6 w-11 rounded-full transition-colors shrink-0"
        style={{ background: checked ? "#4f46e5" : "var(--border)" }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? "calc(100% - 1.375rem)" : "2px" }}
        />
        <input type="checkbox" checked={checked} onChange={() => {}} className="sr-only" />
      </div>
    </label>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function DoctorSettingsClient({
  doctor, specialties, locale, isSubscribed = false,
  secretaries: initialSecretaries = [], contactStatus,
}: {
  doctor: Doctor;
  specialties: Specialty[];
  locale: string;
  isSubscribed?: boolean;
  secretaries?: Array<{ id: string; username: string; name: string; email?: string | null; isActive: boolean }>;
  contactStatus?: { email: string | null; phone: string | null; emailVerified: boolean; phoneVerified: boolean } | null;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const logoRef = useRef<HTMLInputElement>(null);

  /* ── form state ── */
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
  const [secEmail, setSecEmail] = useState("");
  const [secPassword, setSecPassword] = useState("");
  const [secLoading, setSecLoading] = useState(false);
  const [secError, setSecError] = useState("");
  const [secSuccess, setSecSuccess] = useState(false);

  /* ── nav ── */
  type SectionId = "profile" | "clinic" | "verify" | "subscription" | "secretary" | "appearance";
  const [tab, setTab] = useState<SectionId>("profile");

  const navItems: { id: SectionId; icon: typeof User; label: string }[] = [
    { id: "profile",      icon: User,       label: ar ? "ملفي"       : "Profile"      },
    { id: "clinic",       icon: Building2,  label: ar ? "العيادة"    : "Clinic"       },
    { id: "verify",       icon: ShieldCheck,label: ar ? "تأكيد"      : "Verify"       },
    { id: "subscription", icon: Crown,       label: ar ? "الاشتراك"  : "Subscription" },
    ...(isSubscribed ? [{ id: "secretary" as const, icon: UserPlus, label: ar ? "سكرتير" : "Secretary" }] : []),
    { id: "appearance",   icon: Palette,    label: ar ? "المظهر"     : "Appearance"   },
  ];

  /* ── helpers ── */
  function handleNameAr(v: string) { setNameAr(v); const eng = arabicToEnglish(v); if (eng) setName(eng); }
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
  }
  async function handleSave() {
    setSaving(true); setError("");
    try {
      const payload: Record<string, unknown> = {
        name: name || null, nameAr: nameAr || null, bio: bio || null, bioAr: bioAr || null,
        services: services || null, announcement: announcement || null, specialtyId,
        phone: phone || null, email: email || null, licenseNumber: license || null,
        experienceYears: exp ? parseInt(exp) : null, consultationFee: fee ? parseFloat(fee) : null,
        workingDays: days || null, workingHoursStart: from || null, workingHoursEnd: to || null,
        appointmentDuration: apptDuration ? parseInt(apptDuration) : 30,
        clinicAddress: mapData.address || null, clinicLat: mapData.lat ?? null, clinicLng: mapData.lng ?? null,
        showConsultationFee: showFee, recurringPatientsEnabled: recurringEnabled,
      };
      if (logo && logo.length < 400000) payload.logoUrl = logo;
      const result = await updateDoctorSettings(doctor.id, payload);
      if (result.success) {
        setSaved(true); setTimeout(() => setSaved(false), 3000); router.refresh();
      } else {
        const emailErrors: Record<string, string> = {
          unreal_email: ar ? "هذا البريد غير حقيقي" : "Not a real email",
          invalid_email: ar ? "بريد غير صالح" : "Invalid email",
          email_check_failed: ar ? "تعذر التحقق من البريد" : "Could not verify email",
          email_taken: ar ? "البريد مستخدم مسبقاً" : "Email already in use",
        };
        setError(emailErrors[result.error ?? ""] ?? (ar ? "حدث خطأ أثناء الحفظ" : "Save error"));
      }
    } catch { setError(ar ? "تعذّر الاتصال" : "Connection failed"); }
    finally { setSaving(false); }
  }

  /* ── render ── */
  return (
    <div dir={ar ? "rtl" : "ltr"}>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl mb-5 px-4 py-3 text-sm text-rose-400"
          style={{ border: "1px solid rgba(244,63,94,.2)", background: "rgba(244,63,94,.06)" }}>
          <AlertCircle size={15} className="shrink-0" />{error}
        </div>
      )}

      {/* Two-column layout: dir="ltr" so sidebar stays on the right visually */}
      <div className="flex gap-0" dir="ltr">

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 space-y-5" dir={ar ? "rtl" : "ltr"}>

          {/* ─ PROFILE ─ */}
          {tab === "profile" && (
            <>
              {/* Avatar + logo */}
              <FieldCard title={ar ? "الصورة والشعار" : "Photo & logo"}>
                <div className="flex items-center gap-4">
                  <div
                    className="h-16 w-16 shrink-0 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer text-2xl"
                    style={{ background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.25)" }}
                    onClick={() => logoRef.current?.click()}
                  >
                    {logo
                      ? <img src={logo} alt="logo" className="h-full w-full object-cover" />
                      : "🩺"}
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => logoRef.current?.click()}
                      className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition"
                      style={{ border: "1px solid var(--border)", color: "var(--text-1)" }}
                    >
                      <Camera size={13} />
                      {ar ? "رفع صورة / شعار" : "Upload photo"}
                    </button>
                    {logo && (
                      <button type="button" onClick={() => setLogo("")} className="text-xs text-rose-400">
                        {ar ? "حذف الصورة" : "Remove"}
                      </button>
                    )}
                  </div>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </div>
              </FieldCard>

              {/* Names */}
              <FieldCard title={ar ? "الاسم والتخصص" : "Name & specialty"}>
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
              </FieldCard>

              {/* Bio */}
              <FieldCard title={ar ? "النبذة الشخصية" : "Biography"}>
                <div>
                  <label className="form-label">{ar ? "بالعربي" : "Arabic"}</label>
                  <textarea value={bioAr} onChange={(e) => setBioAr(e.target.value)} rows={3} dir="rtl" className="form-input resize-none" placeholder={ar ? "نبذة مختصرة عن خبراتك..." : "Brief bio..."} />
                </div>
                <div>
                  <label className="form-label">{ar ? "بالإنجليزي" : "English"}</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} dir="ltr" className="form-input resize-none" placeholder="Brief bio about your experience..." />
                </div>
              </FieldCard>

              {/* Contact */}
              <FieldCard title={ar ? "بيانات التواصل" : "Contact info"}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">{ar ? "الهاتف" : "Phone"}</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" dir="ltr" className="form-input" placeholder="07XXXXXXXXX" />
                  </div>
                  <div>
                    <label className="form-label">{ar ? "البريد الإلكتروني" : "Email"}</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" dir="ltr" className="form-input" placeholder="dr@email.com" />
                  </div>
                </div>
                <div>
                  <label className="form-label">{ar ? "رقم الترخيص الطبي" : "Medical license No."}</label>
                  <input value={license} onChange={(e) => setLicense(e.target.value)} dir="ltr" className="form-input" placeholder="IQ-MED-12345" />
                </div>
              </FieldCard>

              <SaveButton ar={ar} saving={saving} saved={saved} onClick={handleSave} />
            </>
          )}

          {/* ─ CLINIC ─ */}
          {tab === "clinic" && (
            <>
              {/* Fee & experience */}
              <FieldCard title={ar ? "الكشفية والخبرة" : "Fee & experience"}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label flex items-center gap-1.5">
                      <Banknote size={12} className="text-indigo-400" />
                      {ar ? "سعر الكشفية (د.ع)" : "Fee (IQD)"}
                    </label>
                    <input value={fee} onChange={(e) => setFee(e.target.value)} type="number" min="0" className="form-input" placeholder="50000" />
                  </div>
                  <div>
                    <label className="form-label flex items-center gap-1.5">
                      <Clock size={12} className="text-indigo-400" />
                      {ar ? "سنوات الخبرة" : "Experience (yrs)"}
                    </label>
                    <input value={exp} onChange={(e) => setExp(e.target.value)} type="number" min="0" max="60" className="form-input" placeholder="10" />
                  </div>
                </div>
                <ToggleRow
                  label={ar ? "إظهار السعر للمرضى" : "Show fee to patients"}
                  checked={showFee}
                  onChange={setShowFee}
                  hint={ar ? "عند الإيقاف لن يرى المرضى السعر" : "When off, patients won't see the fee"}
                  locale={locale}
                />
              </FieldCard>

              {/* Working hours */}
              <FieldCard title={ar ? "ساعات ومدة العمل" : "Working hours"}>
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
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">{ar ? "من" : "From"}</label>
                    <input value={from} onChange={(e) => setFrom(e.target.value)} type="time" className="form-input [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="form-label">{ar ? "إلى" : "To"}</label>
                    <input value={to} onChange={(e) => setTo(e.target.value)} type="time" className="form-input [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="form-label flex items-center gap-1">
                      {ar ? "مدة الموعد" : "Appt. duration"}
                      <InfoTooltip locale={locale} text={ar ? "تُستخدم لحجب الأوقات تلقائياً" : "Auto-blocks time slots"} />
                    </label>
                    <div className="relative">
                      <select value={apptDuration} onChange={(e) => setApptDuration(e.target.value)} className="form-input appearance-none pe-6">
                        {[10, 15, 20, 30, 45, 60, 90].map((d) => <option key={d} value={d}>{d}{ar ? "د" : "m"}</option>)}
                      </select>
                      <ChevronDown size={11} className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
                    </div>
                  </div>
                </div>
              </FieldCard>

              {/* ── CLINIC LOCATION — prominent card ── */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: `2px solid ${mapData.lat ? "rgba(99,102,241,.4)" : "rgba(99,102,241,.2)"}` }}
              >
                {/* Header */}
                <div
                  className="flex items-center gap-3 px-4 py-4"
                  style={{ background: "rgba(99,102,241,.08)", borderBottom: "1px solid rgba(99,102,241,.15)" }}
                >
                  <div className="p-2.5 rounded-xl bg-indigo-500/20">
                    <MapPin size={20} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: "var(--text-1)" }}>
                      {ar ? "موقع العيادة على الخريطة" : "Clinic location on map"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                      {mapData.lat
                        ? (ar ? "الموقع محدد ✓" : "Location set ✓")
                        : (ar ? "لم يُحدد الموقع بعد" : "Location not set yet")}
                    </p>
                  </div>
                  {mapData.lat && (
                    <span className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
                      ✓ {ar ? "محدد" : "Set"}
                    </span>
                  )}
                </div>

                {/* Address preview */}
                {mapData.address && (
                  <div
                    className="flex items-start gap-3 px-4 py-3"
                    style={{ borderBottom: "1px solid rgba(99,102,241,.12)", background: "rgba(99,102,241,.04)" }}
                  >
                    <Navigation size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-sm" style={{ color: "var(--text-2)" }}>{mapData.address}</p>
                  </div>
                )}

                {/* Button row */}
                <div className="p-4">
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-sm transition"
                    style={
                      showMap
                        ? { background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", color: "#f87171" }
                        : { background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.35)", color: "#a5b4fc" }
                    }
                  >
                    <MapPin size={16} />
                    {showMap
                      ? (ar ? "إغلاق الخريطة" : "Close map")
                      : mapData.lat
                        ? (ar ? "تعديل الموقع" : "Change location")
                        : (ar ? "تحديد موقع العيادة" : "Set clinic location")}
                  </button>

                  {showMap && (
                    <div className="mt-4 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(99,102,241,.25)" }}>
                      <MapPicker
                        lat={mapData.lat}
                        lng={mapData.lng ?? undefined}
                        address={mapData.address}
                        locale={locale}
                        autoLocate={!mapData.lat}
                        onChange={(lat, lng, address) => setMapData({ lat, lng, address })}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Page content */}
              <FieldCard title={ar ? "محتوى الصفحة العامة" : "Public page content"}>
                <div>
                  <label className="form-label">{ar ? "خدمات العيادة" : "Clinic services"}</label>
                  <textarea value={services} onChange={(e) => setServices(e.target.value)} rows={3} className="form-input resize-none" placeholder={ar ? "سطر لكل خدمة" : "One service per line"} />
                </div>
                <div>
                  <label className="form-label">{ar ? "تنبيه أعلى الصفحة" : "Page notice"}</label>
                  <input value={announcement} onChange={(e) => setAnnouncement(e.target.value)} className="form-input" placeholder={ar ? "مثال: الحجوزات متاحة هذا الأسبوع" : "e.g. Bookings open this week"} />
                </div>
              </FieldCard>

              <SaveButton ar={ar} saving={saving} saved={saved} onClick={handleSave} />
            </>
          )}

          {/* ─ VERIFY ─ */}
          {tab === "verify" && (
            <ContactVerifyPanel
              locale={locale}
              initialEmail={contactStatus?.email ?? email}
              initialPhone={contactStatus?.phone ?? phone}
              emailVerified={contactStatus?.emailVerified ?? false}
              phoneVerified={contactStatus?.phoneVerified ?? false}
            />
          )}

          {/* ─ SUBSCRIPTION ─ */}
          {tab === "subscription" && (
            <div className="space-y-4">
              {/* Status card */}
              <div
                className="flex items-start gap-4 p-5 rounded-2xl"
                style={
                  isSubscribed
                    ? { border: "1px solid rgba(16,185,129,.3)", background: "rgba(16,185,129,.07)" }
                    : { border: "1px solid rgba(245,158,11,.3)", background: "rgba(245,158,11,.07)" }
                }
              >
                <div className={`p-3 rounded-2xl ${isSubscribed ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
                  <Crown size={22} className={isSubscribed ? "text-emerald-400" : "text-amber-400"} />
                </div>
                <div>
                  <p className={`font-bold text-sm ${isSubscribed ? "text-emerald-300" : "text-amber-300"}`}>
                    {isSubscribed
                      ? (ar ? "اشتراكك نشط ✓" : "Subscription active ✓")
                      : (ar ? "الخطة المجانية" : "Free plan")}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                    {isSubscribed
                      ? (ar ? "جميع الميزات متاحة لك" : "All features are unlocked for you")
                      : (ar ? "اشترك للحصول على السكرتير والرسائل والمزيد" : "Subscribe for secretary, messaging & more")}
                  </p>
                </div>
              </div>

              <ToggleRow
                label={ar ? "ميزة المرضى الدائمين" : "Recurring patients feature"}
                checked={recurringEnabled}
                onChange={setRecurringEnabled}
                hint={ar ? "عند الإيقاف تُخفى قائمة المرضى الدائمين" : "When off, recurring patients menu is hidden"}
                locale={locale}
              />
            </div>
          )}

          {/* ─ SECRETARY ─ */}
          {tab === "secretary" && isSubscribed && (
            <div className="space-y-4">
              {/* Existing secretaries */}
              {secretaries.length > 0 && (
                <FieldCard title={ar ? "السكرتارية الحالية" : "Current secretaries"}>
                  {secretaries.map((s, i) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 px-1 py-1"
                      style={i > 0 ? { borderTop: "1px solid var(--border)", paddingTop: "0.75rem" } : {}}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{s.name}</p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-3)" }} dir="ltr">
                          {s.username.startsWith("pending_") || /^\d{7,}$/.test(s.username)
                            ? (s.email ?? s.username)
                            : `@${s.username}`}
                        </p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                        {s.isActive ? (ar ? "نشط" : "Active") : (ar ? "معطل" : "Disabled")}
                      </span>
                    </div>
                  ))}
                </FieldCard>
              )}

              {/* Add new */}
              <FieldCard title={ar ? "إضافة سكرتير جديد" : "Add new secretary"}>
                {secError && (
                  <p className="text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertCircle size={12} />{secError}
                  </p>
                )}
                {secSuccess && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <Check size={12} />
                    {ar
                      ? "أُرسل رمز التأكيد إلى بريده. يدخل بالبريد ثم يختار اسم المستخدم."
                      : "Verification code sent to their email. They sign in then choose a username."}
                  </p>
                )}
                <div>
                  <label className="form-label">{ar ? "الاسم الكامل" : "Full name"}</label>
                  <input value={secName} onChange={(e) => setSecName(e.target.value)} className="form-input" placeholder={ar ? "الاسم الكامل" : "Full name"} />
                </div>
                <div>
                  <label className="form-label">{ar ? "البريد الإلكتروني" : "Email"}</label>
                  <input value={secEmail} onChange={(e) => setSecEmail(e.target.value)} type="email" dir="ltr" className="form-input" placeholder="secretary@email.com" />
                </div>
                <div>
                  <label className="form-label">{ar ? "كلمة المرور" : "Password"}</label>
                  <input value={secPassword} onChange={(e) => setSecPassword(e.target.value)} type="password" className="form-input" placeholder="••••••••" />
                </div>
                <button
                  type="button"
                  disabled={secLoading}
                  onClick={async () => {
                    if (!secName || !secEmail || !secPassword) { setSecError(ar ? "جميع الحقول مطلوبة" : "All fields required"); return; }
                    setSecLoading(true); setSecError("");
                    const r = await createSecretaryForDoctor(doctor.id, { name: secName, email: secEmail, password: secPassword });
                    setSecLoading(false);
                    if (r.success) {
                      setSecSuccess(true); setSecName(""); setSecEmail(""); setSecPassword("");
                      const updated = await getSecretariesForDoctorPortal(doctor.id);
                      setSecretaries(updated);
                      setTimeout(() => setSecSuccess(false), 4000);
                    } else {
                      setSecError(
                        r.error === "email_taken" ? (ar ? "البريد مستخدم مسبقاً" : "Email already in use")
                        : r.error === "email_required" || r.error === "invalid_email" || r.error === "unreal_email"
                          ? (ar ? "أدخل بريداً حقيقياً" : "Enter a real email")
                        : (ar ? "حدث خطأ" : "Error")
                      );
                    }
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold w-full transition disabled:opacity-50"
                  style={{ border: "1px solid rgba(99,102,241,.35)", background: "rgba(99,102,241,.12)", color: "#a5b4fc" }}
                >
                  {secLoading
                    ? <><Loader2 size={14} className="animate-spin" />{ar ? "جاري الإضافة..." : "Adding..."}</>
                    : <><UserPlus size={14} />{ar ? "إضافة سكرتير" : "Add secretary"}</>}
                </button>
              </FieldCard>
            </div>
          )}

          {/* ─ APPEARANCE ─ */}
          {tab === "appearance" && (
            <FieldCard title={ar ? "مظهر الواجهة" : "Interface theme"} hint={ar ? "يُطبق على جميع الصفحات" : "Applies everywhere"}>
              <ThemeToggle locale={locale} />
            </FieldCard>
          )}
        </div>

        {/* ── Right sidebar nav ── */}
        <aside
          className="sticky self-start shrink-0 flex flex-col py-3 gap-0.5 ms-0"
          style={{
            top: 0,
            width: "56px",
            borderInlineStart: "1px solid var(--border)",
          }}
        >
          {navItems.map(({ id, icon: Icon, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                title={label}
                className="relative flex flex-col items-center justify-center gap-1 py-3 mx-1 rounded-xl transition-all"
                style={{
                  color: active ? "#818cf8" : "var(--text-3)",
                  background: active ? "rgba(99,102,241,.12)" : "transparent",
                }}
              >
                {active && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-l-full bg-indigo-500" />
                )}
                <Icon size={18} strokeWidth={active ? 2.3 : 1.8} />
                <span className="text-[8px] font-semibold leading-tight text-center px-0.5" style={{ maxWidth: "52px" }}>
                  {label}
                </span>
              </button>
            );
          })}
        </aside>
      </div>
    </div>
  );
}
