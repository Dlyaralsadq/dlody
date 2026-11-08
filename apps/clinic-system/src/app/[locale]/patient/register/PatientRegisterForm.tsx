"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Phone, Lock, Eye, EyeOff, ArrowRight, User2, Mail } from "lucide-react";
import { registerPatientAction } from "@/app/actions/patientAuth";

export default function PatientRegisterForm({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("locale", locale);
    const result = await registerPatientAction(fd);
    if (result.success) {
      router.push(result.redirectTo ?? `/${locale}/verify-contact`);
      router.refresh();
    } else {
      const msgs: Record<string, string> = {
        phone_taken: ar ? "رقم الهاتف مسجّل مسبقاً" : "Phone already registered",
        email_taken: ar ? "البريد مسجّل مسبقاً" : "Email already registered",
        invalid_email: ar ? "بريد غير صالح" : "Invalid email",
        invalid_data: ar ? "تحقق من البيانات المدخلة" : "Please check your input",
      };
      setError(msgs[result.error ?? ""] ?? (ar ? "حدث خطأ" : "Something went wrong"));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="form-label">{ar ? "الاسم الكامل" : "Full name"}</label>
        <div className="relative">
          <User2 className="absolute inset-y-0 start-3.5 my-auto h-4 w-4 text-white/25" />
          <input name="name" type="text" required className="form-input ps-10 pe-4" placeholder={ar ? "محمد أحمد" : "Your name"} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="form-label">{ar ? "رقم الهاتف" : "Phone number"}</label>
        <div className="relative">
          <Phone className="absolute inset-y-0 start-3.5 my-auto h-4 w-4 text-white/25" />
          <input name="phone" type="tel" required dir="ltr" className="form-input ps-10 pe-4" placeholder="07XXXXXXXXX" />
        </div>
        <p className="text-[11px] text-white/30">
          {ar ? "سيتم تأكيده لاحقاً عبر واتساب" : "You'll verify it later via WhatsApp"}
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="form-label">{ar ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}</label>
        <div className="relative">
          <Mail className="absolute inset-y-0 start-3.5 my-auto h-4 w-4 text-white/25" />
          <input name="email" type="email" dir="ltr" className="form-input ps-10 pe-4" placeholder="you@example.com" />
        </div>
        <p className="text-[11px] text-white/30">
          {ar ? "يُؤكد عبر رسالة SMS إلى هاتفك" : "Verified via SMS to your phone"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="form-label">{ar ? "تاريخ الميلاد" : "Date of birth"}</label>
          <input name="dateOfBirth" type="date" className="form-input w-full [color-scheme:dark]" />
        </div>
        <div className="space-y-1.5">
          <label className="form-label">{ar ? "الجنس" : "Gender"}</label>
          <select name="gender" className="form-input w-full">
            <option value="">—</option>
            <option value="male">{ar ? "ذكر" : "Male"}</option>
            <option value="female">{ar ? "أنثى" : "Female"}</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="form-label">{ar ? "فصيلة الدم" : "Blood type"}</label>
        <select name="bloodType" className="form-input w-full">
          <option value="">—</option>
          {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="form-label">{ar ? "كلمة المرور" : "Password"}</label>
        <div className="relative">
          <Lock className="absolute inset-y-0 start-3.5 my-auto h-4 w-4 text-white/25" />
          <input
            name="password"
            type={showPwd ? "text" : "password"}
            required
            minLength={6}
            className="form-input ps-10 pe-10"
            placeholder={ar ? "6 أحرف على الأقل" : "Min 6 characters"}
          />
          <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute inset-y-0 end-3 my-auto text-white/25 hover:text-white/60">
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>
            {ar ? "إنشاء حساب" : "Create account"}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-white/40">
        {ar ? "لديك حساب؟ " : "Already have an account? "}
        <Link href={`/${locale}/patient/login`} className="text-cyan-400 hover:underline font-semibold">
          {ar ? "تسجيل الدخول" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
