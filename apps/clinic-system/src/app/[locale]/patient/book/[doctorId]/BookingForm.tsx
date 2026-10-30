"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, User, Phone, FileText, CheckCircle2, AlertCircle, Droplets } from "lucide-react";
import { createOnlineBooking } from "@/app/actions/publicBooking";

const TIME_SLOTS = [
  "08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","12:30","13:00","13:30",
  "14:00","14:30","15:00","15:30","16:00","16:30",
  "17:00","17:30","18:00","18:30","19:00","19:30",
];

export interface PatientProfileData {
  name: string;
  phone: string;
  gender: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  age: number | null;
}

export default function BookingForm({
  doctorId,
  doctorName,
  doctorNameAr,
  specialtyAr,
  specialtyEn,
  locale,
  profile,
}: {
  doctorId: string;
  doctorName: string;
  doctorNameAr: string;
  specialtyAr: string;
  specialtyEn: string;
  locale: string;
  profile: PatientProfileData;
}) {
  const ar = locale === "ar";
  const router = useRouter();

  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [aptNumber, setAptNumber] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [forSelf, setForSelf] = useState(true);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrMsg("");

    const fd = new FormData(e.currentTarget);
    const result = await createOnlineBooking({
      doctorId,
      patientName: (fd.get("name") as string) ?? profile.name,
      patientNameAr: (fd.get("nameAr") as string) ?? profile.name,
      phone: (fd.get("phone") as string) ?? profile.phone,
      date: fd.get("date") as string,
      time: fd.get("time") as string,
      reason: fd.get("reason") as string,
      locale,
      bookingForSelf: forSelf,
      patientAge: forSelf ? profile.age : (fd.get("age") ? parseInt(fd.get("age") as string) : null),
      patientGender: forSelf ? profile.gender : (fd.get("gender") as string),
      patientBloodType: forSelf ? profile.bloodType : (fd.get("bloodType") as string),
    });

    if (result.success) {
      setAptNumber(result.appointmentNumber ?? "");
      setStep("success");
    } else {
      const msgs: Record<string, { ar: string; en: string }> = {
        slot_taken: { ar: "هذا الوقت محجوز", en: "This time slot is taken" },
        doctor_unavailable: { ar: "الطبيب غير متاح", en: "Doctor unavailable" },
        invalid_date: { ar: "التاريخ غير صحيح", en: "Invalid date" },
        login_required: { ar: "يجب تسجيل الدخول أولاً", en: "Please sign in first" },
      };
      setErrMsg((msgs[result.error ?? ""] ?? msgs.invalid_date)[ar ? "ar" : "en"]);
      setLoading(false);
    }
  }

  if (step === "success") {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <CheckCircle2 size={48} className="text-emerald-400 mb-4" />
        <h2 className="text-2xl font-black text-white mb-2">{ar ? "تم الحجز!" : "Booked!"}</h2>
        <p className="font-mono text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-xl mb-6">{aptNumber}</p>
        <button onClick={() => router.push(`/${locale}/patient/account`)} className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold">
          {ar ? "عرض مواعيدي" : "My appointments"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertCircle size={15} />{errMsg}
        </div>
      )}

      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/8 px-4 py-3">
        <p className="text-xs text-indigo-400/60">{ar ? "الطبيب" : "Doctor"}</p>
        <p className="text-sm font-bold text-white">{ar ? doctorNameAr : doctorName}</p>
      </div>

      {/* Self vs other */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setForSelf(true)}
          className={`rounded-xl border py-2.5 text-xs font-semibold transition ${forSelf ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300" : "border-white/10 text-white/40"}`}
        >
          {ar ? "حجز لنفسي" : "For myself"}
        </button>
        <button
          type="button"
          onClick={() => setForSelf(false)}
          className={`rounded-xl border py-2.5 text-xs font-semibold transition ${!forSelf ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300" : "border-white/10 text-white/40"}`}
        >
          {ar ? "حجز لشخص آخر" : "For someone else"}
        </button>
      </div>

      {forSelf ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-4 space-y-1 text-xs">
          <p className="text-emerald-400 font-semibold mb-2">{ar ? "بياناتك (تُملأ تلقائياً)" : "Your info (auto-filled)"}</p>
          <p className="text-white/70"><User size={12} className="inline me-1" />{profile.name}</p>
          <p className="text-white/70" dir="ltr"><Phone size={12} className="inline me-1" />{profile.phone}</p>
          {profile.age != null && <p className="text-white/70">{ar ? "العمر:" : "Age:"} {profile.age}</p>}
          {profile.gender && <p className="text-white/70">{ar ? "الجنس:" : "Gender:"} {profile.gender}</p>}
          {profile.bloodType && <p className="text-white/70"><Droplets size={12} className="inline me-1" />{profile.bloodType}</p>}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">{ar ? "الاسم *" : "Name *"}</label>
              <input name="nameAr" required dir="rtl" className="form-input w-full" placeholder="محمد أحمد" />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">{ar ? "الهاتف *" : "Phone *"}</label>
              <input name="phone" required type="tel" dir="ltr" className="form-input w-full" placeholder="07XXXXXXXXX" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">{ar ? "العمر" : "Age"}</label>
              <input name="age" type="number" min="0" max="120" className="form-input w-full" />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">{ar ? "الجنس" : "Gender"}</label>
              <select name="gender" className="form-input w-full">
                <option value="">{ar ? "—" : "—"}</option>
                <option value="male">{ar ? "ذكر" : "Male"}</option>
                <option value="female">{ar ? "أنثى" : "Female"}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">{ar ? "فصيلة الدم" : "Blood type"}</label>
              <select name="bloodType" className="form-input w-full">
                <option value="">—</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/40 mb-1.5">{ar ? "التاريخ *" : "Date *"}</label>
          <input name="date" required type="date" min={minDateStr} className="form-input w-full [color-scheme:dark]" />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">{ar ? "الوقت *" : "Time *"}</label>
          <select name="time" required className="form-input w-full">
            <option value="">{ar ? "اختر" : "Choose"}</option>
            {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-white/40 mb-1.5">{ar ? "سبب الزيارة *" : "Reason *"}</label>
        <textarea name="reason" required rows={3} className="form-input w-full resize-none" placeholder={ar ? "اذكر سبب الزيارة..." : "Reason..."} />
      </div>

      <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-bold text-white disabled:opacity-50">
        {loading ? "..." : (ar ? "تأكيد الحجز" : "Confirm booking")}
      </button>
    </form>
  );
}
