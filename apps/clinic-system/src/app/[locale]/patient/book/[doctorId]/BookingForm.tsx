"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Phone, FileText, CheckCircle2, AlertCircle,
  Droplets, CreditCard, History, RefreshCw
} from "lucide-react";
import { createOnlineBooking } from "@/app/actions/publicBooking";
import { lookupPatientByNationalId } from "@/app/actions/clinic";
import TimeSlotSelect from "@/components/ui/TimeSlotSelect";

export interface PatientProfileData {
  name: string;
  phone: string;
  gender: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  age: number | null;
  nationalId?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
}

export default function BookingForm({
  doctorId,
  doctorName,
  doctorNameAr,
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

  // ── National ID — primary field, drives lookup ────────────────────────
  const [nationalId, setNationalId] = useState(profile.nationalId ?? "");
  const [lookingUp, setLookingUp]   = useState(false);
  const [returning, setReturning]   = useState<Awaited<ReturnType<typeof lookupPatientByNationalId>>>(null);

  // For "someone else" booking — auto-filled from lookup
  const [otherName, setOtherName]     = useState("");
  const [otherPhone, setOtherPhone]   = useState("");
  const [otherGender, setOtherGender] = useState("");

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 10);

  const [date, setDate] = useState(minDateStr);
  const [time, setTime] = useState("");

  // ── Lookup by national ID (debounced 500ms) ───────────────────────────
  useEffect(() => {
    const trimmed = nationalId.trim();
    if (trimmed.length < 3) { setReturning(null); return; }
    const timer = setTimeout(async () => {
      setLookingUp(true);
      try {
        const result = await lookupPatientByNationalId(doctorId, trimmed);
        setReturning(result);
        // For "someone else" mode: auto-fill fields if patient found
        if (result && !forSelf) {
          setOtherName(result.name);
          setOtherPhone(result.phone);
          setOtherGender(result.gender);
        }
      } finally {
        setLookingUp(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [nationalId, doctorId, forSelf]);

  // Reset "other" fields when switching modes
  useEffect(() => {
    if (forSelf) {
      setOtherName(""); setOtherPhone(""); setOtherGender("");
      // Re-trigger lookup with profile's national ID
      setNationalId(profile.nationalId ?? "");
    } else {
      setNationalId("");
      setReturning(null);
    }
  }, [forSelf, profile.nationalId]);

  // ── Submit ────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrMsg("");

    const fd = new FormData(e.currentTarget);
    try {
      const result = await createOnlineBooking({
        doctorId,
        patientName:    forSelf ? profile.name    : otherName,
        patientNameAr:  forSelf ? profile.name    : otherName,
        phone:          forSelf ? profile.phone   : otherPhone,
        date,
        time,
        reason: fd.get("reason") as string,
        locale,
        bookingForSelf: forSelf,
        nationalId: nationalId.trim() || null,
        patientAge:      forSelf ? profile.age    : (fd.get("age")      ? parseInt(fd.get("age") as string) : null),
        patientGender:   forSelf ? profile.gender : otherGender,
        patientBloodType: forSelf ? profile.bloodType : (fd.get("bloodType") as string || null),
      });

      if (result.success) {
        setAptNumber(result.appointmentNumber ?? "");
        setStep("success");
      } else {
        const msgs: Record<string, { ar: string; en: string }> = {
          slot_taken:            { ar: "هذا الوقت محجوز",               en: "This time slot is taken" },
          doctor_unavailable:    { ar: "الطبيب غير متاح",               en: "Doctor unavailable" },
          invalid_date:          { ar: "التاريخ غير صحيح",              en: "Invalid date" },
          login_required:        { ar: "يجب تسجيل الدخول أولاً",       en: "Please sign in first" },
          national_id_required:  { ar: "رقم الهوية مطلوب لإتمام الحجز", en: "National ID is required to complete booking" },
        };
        setErrMsg((msgs[result.error ?? ""] ?? msgs.invalid_date)[ar ? "ar" : "en"]);
      }
    } catch {
      setErrMsg(ar ? "حدث خطأ، يرجى المحاولة مرة أخرى" : "An error occurred, please try again");
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <CheckCircle2 size={48} className="text-emerald-400 mb-4" />
        <h2 className="text-2xl font-black mb-2" style={{ color: "var(--text-1)" }}>
          {ar ? "تم الحجز!" : "Booked!"}
        </h2>
        <p className="font-mono text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-xl mb-6">{aptNumber}</p>
        <button
          onClick={() => router.push(`/${locale}/patient/account`)}
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
        >
          {ar ? "عرض مواعيدي" : "My appointments"}
        </button>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {errMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertCircle size={15} />{errMsg}
        </div>
      )}

      {/* Doctor pill */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/8 px-4 py-3">
        <p className="text-xs text-indigo-400/60">{ar ? "الطبيب" : "Doctor"}</p>
        <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{ar ? doctorNameAr : doctorName}</p>
      </div>

      {/* Self vs other toggle */}
      <div className="grid grid-cols-2 gap-2">
        {(["self", "other"] as const).map((mode) => {
          const active = mode === "self" ? forSelf : !forSelf;
          return (
            <button key={mode} type="button" onClick={() => setForSelf(mode === "self")}
              className={`rounded-xl border py-2.5 text-xs font-semibold transition ${
                active ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300" : "border-white/10 text-white/40"
              }`}>
              {mode === "self" ? (ar ? "حجز لنفسي" : "For myself") : (ar ? "حجز لشخص آخر" : "For someone else")}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          NATIONAL ID — ALWAYS FIRST, primary identifier
      ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/6 p-4 space-y-2">
        <label className="form-label flex items-center gap-1.5">
          <CreditCard size={13} className="text-amber-400" />
          {ar ? "رقم الهوية الوطنية" : "National ID"}
          <span className="text-amber-400/70 text-[10px] font-normal ms-1">
            {ar ? "— مطلوب لتأكيد الحجز" : "— required to confirm"}
          </span>
          {lookingUp && <RefreshCw size={11} className="animate-spin text-indigo-400 ms-auto" />}
          {!lookingUp && returning && (
            <span className="ms-auto text-[10px] text-emerald-400 font-semibold">
              ✓ {ar ? "تم التعرف" : "Recognised"}
            </span>
          )}
        </label>
        <input
          name="nationalId"
          dir="ltr"
          required
          value={nationalId}
          onChange={(e) => {
            setNationalId(e.target.value);
            if (!e.target.value.trim()) {
              setReturning(null);
              if (!forSelf) { setOtherName(""); setOtherPhone(""); setOtherGender(""); }
            }
          }}
          className="form-input w-full font-mono tracking-widest"
          placeholder={ar ? "أدخل رقم الهوية..." : "Enter national ID..."}
          autoComplete="off"
        />

        {/* Returning patient banner */}
        {returning && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/8 px-3 py-2.5 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black shrink-0">
                {returning.visitCount + 1}
              </span>
              <p className="text-xs font-bold text-emerald-400">
                {ar
                  ? `مريض متكرر — الزيارة رقم ${returning.visitCount + 1}`
                  : `Returning patient — visit #${returning.visitCount + 1}`}
              </p>
            </div>
            {returning.lastVisit && (
              <div className="rounded px-2 py-1.5 space-y-0.5" style={{ background: "rgba(0,0,0,.12)" }}>
                <p className="text-[10px] text-emerald-400/60 flex items-center gap-1">
                  <History size={10} />
                  {ar ? "آخر زيارة" : "Last visit"} ·{" "}
                  {new Date(returning.lastVisit.date).toLocaleDateString(ar ? "ar-IQ" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                </p>
                {returning.lastVisit.diagnosis && (
                  <p className="text-[11px] text-slate-300">
                    <span className="text-slate-500">{ar ? "التشخيص: " : "Dx: "}</span>
                    {returning.lastVisit.diagnosis}
                  </p>
                )}
                {returning.lastVisit.prescription && (
                  <p className="text-[11px] text-slate-400">
                    <span className="text-slate-500">{ar ? "الوصفة: " : "Rx: "}</span>
                    {returning.lastVisit.prescription}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {!nationalId && (
          <p className="text-[11px] text-amber-400/70 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400/60 animate-pulse inline-block" />
            {ar ? "أدخل رقم الهوية أولاً" : "Enter national ID first"}
          </p>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PATIENT INFO
      ══════════════════════════════════════════════════════════════ */}
      {forSelf ? (
        /* Self: show profile summary */
        <div className="rounded-xl border border-white/8 p-4 space-y-1 text-xs" style={{ background: "var(--bg-surface)" }}>
          <p className="font-semibold mb-2" style={{ color: "var(--text-2)" }}>{ar ? "بياناتك" : "Your info"}</p>
          <p style={{ color: "var(--text-2)" }}><User size={12} className="inline me-1" />{profile.name}</p>
          <p dir="ltr" style={{ color: "var(--text-2)" }}><Phone size={12} className="inline me-1" />{profile.phone}</p>
          {profile.age  != null && <p style={{ color: "var(--text-3)" }}>{ar ? "العمر:" : "Age:"} {profile.age}</p>}
          {profile.gender     && <p style={{ color: "var(--text-3)" }}>{ar ? "الجنس:" : "Gender:"} {profile.gender}</p>}
          {profile.bloodType  && <p style={{ color: "var(--text-3)" }}><Droplets size={12} className="inline me-1" />{profile.bloodType}</p>}
        </div>
      ) : (
        /* Someone else: controlled fields, auto-filled from lookup */
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">{ar ? "الاسم *" : "Name *"}</label>
              <input
                required
                value={otherName}
                onChange={(e) => setOtherName(e.target.value)}
                dir="rtl"
                className="form-input w-full"
                placeholder={ar ? "محمد أحمد" : "Full name"}
              />
            </div>
            <div>
              <label className="form-label">{ar ? "الهاتف *" : "Phone *"}</label>
              <input
                required
                value={otherPhone}
                onChange={(e) => setOtherPhone(e.target.value)}
                type="tel" dir="ltr"
                className="form-input w-full"
                placeholder="07XXXXXXXXX"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">{ar ? "الجنس" : "Gender"}</label>
              <select
                value={otherGender}
                onChange={(e) => setOtherGender(e.target.value)}
                className="form-input w-full"
              >
                <option value="">{ar ? "—" : "—"}</option>
                <option value="male">{ar ? "ذكر" : "Male"}</option>
                <option value="female">{ar ? "أنثى" : "Female"}</option>
              </select>
            </div>
            <div>
              <label className="form-label">{ar ? "العمر" : "Age"}</label>
              <input name="age" type="number" min="0" max="120" className="form-input w-full" />
            </div>
            <div>
              <label className="form-label">{ar ? "فصيلة الدم" : "Blood"}</label>
              <select name="bloodType" className="form-input w-full">
                <option value="">—</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
          {returning && (
            <p className="text-[11px] text-slate-500">
              ✓ {ar ? "تم تعبئة البيانات من السجل السابق — يمكنك التعديل" : "Fields filled from previous record — you can edit"}
            </p>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          DATE / TIME / REASON
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">{ar ? "التاريخ *" : "Date *"}</label>
          <input
            name="date" required type="date" min={minDateStr} value={date}
            onChange={(e) => { setDate(e.target.value); setTime(""); }}
            className="form-input w-full [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="form-label">{ar ? "الوقت *" : "Time *"}</label>
          <TimeSlotSelect
            doctorId={doctorId} date={date} locale={locale}
            value={time} onChange={setTime} name="time" required
            className="form-input w-full"
          />
        </div>
      </div>

      <div>
        <label className="form-label flex items-center gap-1.5">
          <FileText size={12} />
          {ar ? "سبب الزيارة *" : "Reason *"}
        </label>
        <textarea
          name="reason" required rows={3}
          className="form-input w-full resize-none"
          placeholder={ar ? "اذكر سبب الزيارة..." : "Reason for visit..."}
        />
      </div>

      <button
        type="submit" disabled={loading || !nationalId.trim()}
        className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-bold text-white disabled:opacity-50 transition"
      >
        {loading ? (ar ? "جارٍ الحجز..." : "Booking...") : (ar ? "تأكيد الحجز" : "Confirm booking")}
      </button>
    </form>
  );
}
