"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { User, Phone, Lock, Stethoscope, CheckCircle2, AlertCircle, Eye, EyeOff, MapPin } from "lucide-react";
import { arabicToEnglish } from "@/lib/transliterate";
import { registerDoctor } from "@/app/actions/register";

const MapPicker = dynamic(() => import("@/components/ui/MapPicker"), { ssr: false });

interface Specialty { id: string; name: string; nameAr: string; }

export default function DoctorRegisterForm({
  specialties,
  locale,
}: {
  specialties: Specialty[];
  locale: string;
}) {
  const ar = locale === "ar";
  const router = useRouter();

  const [step, setStep] = useState<"form" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [mapData, setMapData] = useState<{ lat: number | null; lng: number | null; address: string }>({
    lat: null, lng: null, address: ""
  });

  function handleNameAr(v: string) {
    setNameAr(v);
    const eng = arabicToEnglish(v);
    if (eng) setNameEn(eng);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const pwd  = fd.get("password") as string;
    const pwd2 = fd.get("password2") as string;

    if (pwd !== pwd2) {
      setError(ar ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      setLoading(false);
      return;
    }

    const fee = fd.get("fee") as string;
    const result = await registerDoctor({
      nameAr:            fd.get("nameAr") as string,
      name:              fd.get("name") as string,
      username:          fd.get("username") as string,
      password:          pwd,
      phone:             fd.get("phone") as string,
      specialtyId:       fd.get("specialtyId") as string,
      clinicAddress:     mapData.address || (fd.get("address") as string) || undefined,
      clinicLat:         mapData.lat ?? undefined,
      clinicLng:         mapData.lng ?? undefined,
      consultationFee:   fee ? parseFloat(fee) : undefined,
      workingHoursStart: fd.get("from") as string || undefined,
      workingHoursEnd:   fd.get("to") as string || undefined,
    });

    if (result.success) {
      setStep("done");
    } else {
      const msgs: Record<string, { ar: string; en: string }> = {
        username_taken:   { ar: "اسم المستخدم محجوز، اختر اسماً آخر", en: "Username already taken" },
        invalid_specialty:{ ar: "التخصص غير صحيح", en: "Invalid specialty" },
      };
      setError((msgs[result.error ?? ""] ?? { ar: "حدث خطأ، حاول مجدداً", en: "An error occurred" })[ar ? "ar" : "en"]);
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center text-center py-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 mb-6">
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        <h2 className="text-xl font-black text-white mb-2">
          {ar ? "تم إنشاء حسابك!" : "Account created!"}
        </h2>
        <p className="text-sm text-white/50 mb-6 max-w-xs">
          {ar
            ? "يمكنك الآن تسجيل الدخول وإضافة موقع عيادتك لتظهر في خريطة المرضى. لفتح نظام إدارة العيادة الكامل تواصل مع مدير المنصة للاشتراك."
            : "You can now login and add your clinic location to appear on the patient map. To unlock the full clinic management system, contact the platform admin."}
        </p>
        <button
          onClick={() => router.push(`/${locale}/login`)}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-bold text-white"
        >
          {ar ? "تسجيل الدخول" : "Sign in"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Names */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/40 mb-1.5">{ar ? "الاسم بالعربي *" : "Arabic name *"}</label>
          <div className="relative">
            <input
              name="nameAr" required dir="rtl"
              value={nameAr}
              onChange={(e) => handleNameAr(e.target.value)}
              placeholder="د. أحمد محمد"
              className="w-full rounded-xl border border-white/10 bg-[#0c1121] ps-4 pe-9 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
            />
            <User size={13} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-white/25" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">{ar ? "الاسم بالإنجليزي" : "English name"}</label>
          <div className="relative">
            <input
              name="name" dir="ltr"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Dr. Ahmed Mohammed"
              className="w-full rounded-xl border border-white/10 bg-[#0c1121] ps-4 pe-9 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
            />
            <User size={13} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-white/25" />
          </div>
        </div>
      </div>

      {/* Specialty */}
      <div>
        <label className="block text-xs text-white/40 mb-1.5">{ar ? "التخصص *" : "Specialty *"}</label>
        <div className="relative">
          <select
            name="specialtyId" required
            className="w-full appearance-none rounded-xl border border-white/10 bg-[#0c1121] ps-4 pe-9 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
          >
            <option value="">{ar ? "اختر التخصص" : "Choose specialty"}</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>{ar ? s.nameAr : s.name}</option>
            ))}
          </select>
          <Stethoscope size={13} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-white/25" />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs text-white/40 mb-1.5">{ar ? "رقم الهاتف *" : "Phone *"}</label>
        <div className="relative">
          <input
            name="phone" required type="tel" dir="ltr"
            placeholder="07XXXXXXXXX"
            className="w-full rounded-xl border border-white/10 bg-[#0c1121] ps-4 pe-9 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
          />
          <Phone size={13} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-white/25" />
        </div>
      </div>

      {/* Location */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-white/40">{ar ? "موقع العيادة على الخريطة" : "Clinic location on map"}</label>
          <button type="button" onClick={() => setShowMap(!showMap)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1">
            <MapPin size={11} />
            {showMap ? (ar ? "إخفاء" : "Hide") : (ar ? "تحديد الموقع" : "Set location")}
          </button>
        </div>
        {mapData.address && (
          <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
            <MapPin size={10} className="text-indigo-400 shrink-0" />
            {mapData.address.slice(0, 80)}{mapData.address.length > 80 ? "..." : ""}
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
        {!showMap && (
          <input
            name="address"
            placeholder={ar ? "بغداد — الكرادة — شارع ..." : "Baghdad — Karrada — ..."}
            className="w-full rounded-xl border border-white/10 bg-[#0c1121] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
          />
        )}
      </div>

      {/* Fee + Hours */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-white/40 mb-1.5">{ar ? "سعر الكشفية (د.ع)" : "Fee (IQD)"}</label>
          <input name="fee" type="number" min="0" placeholder="50000"
            className="w-full rounded-xl border border-white/10 bg-[#0c1121] px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50" />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">{ar ? "من" : "From"}</label>
          <input name="from" type="time"
            className="w-full rounded-xl border border-white/10 bg-[#0c1121] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 [color-scheme:dark]" />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">{ar ? "إلى" : "To"}</label>
          <input name="to" type="time"
            className="w-full rounded-xl border border-white/10 bg-[#0c1121] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 [color-scheme:dark]" />
        </div>
      </div>

      <hr className="border-white/8" />

      {/* Username */}
      <div>
        <label className="block text-xs text-white/40 mb-1.5">{ar ? "اسم المستخدم *" : "Username *"}</label>
        <input
          name="username" required dir="ltr" autoComplete="username"
          placeholder={ar ? "مثال: dr.ahmed" : "e.g. dr.ahmed"}
          className="w-full rounded-xl border border-white/10 bg-[#0c1121] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
        />
      </div>

      {/* Passwords */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/40 mb-1.5">{ar ? "كلمة المرور *" : "Password *"}</label>
          <div className="relative">
            <input
              name="password" required type={showPwd ? "text" : "password"}
              minLength={6} autoComplete="new-password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-[#0c1121] ps-4 pe-9 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60">
              {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">{ar ? "تأكيد كلمة المرور *" : "Confirm password *"}</label>
          <div className="relative">
            <input
              name="password2" required type={showPwd ? "text" : "password"}
              minLength={6} autoComplete="new-password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-[#0c1121] ps-4 pe-9 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
            />
            <Lock size={13} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-white/25" />
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/50 hover:opacity-90 disabled:opacity-50 transition mt-2"
      >
        {loading
          ? <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />{ar ? "جاري إنشاء الحساب..." : "Creating account..."}</>
          : ar ? "إنشاء حساب طبيب" : "Create doctor account"
        }
      </button>
    </form>
  );
}
