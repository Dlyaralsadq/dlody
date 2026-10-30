"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Phone, Lock, Eye, EyeOff, ArrowRight, User2 } from "lucide-react";
import { patientLoginAction } from "@/app/actions/patientAuth";

export default function PatientLoginForm({ locale }: { locale: string }) {
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
    const result = await patientLoginAction(fd);
    if (result.success) {
      router.push(`/${locale}/patient`);
      router.refresh();
    } else {
      setError(ar ? "رقم الهاتف أو كلمة المرور غير صحيحة" : "Invalid phone or password");
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
        <label className="form-label">{ar ? "رقم الهاتف" : "Phone number"}</label>
        <div className="relative">
          <Phone className="absolute inset-y-0 start-3.5 my-auto h-4 w-4 text-white/25" />
          <input
            name="phone"
            type="tel"
            required
            dir="ltr"
            className="form-input ps-10 pe-4"
            placeholder="07XXXXXXXXX"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="form-label">{ar ? "كلمة المرور" : "Password"}</label>
        <div className="relative">
          <Lock className="absolute inset-y-0 start-3.5 my-auto h-4 w-4 text-white/25" />
          <input
            name="password"
            type={showPwd ? "text" : "password"}
            required
            className="form-input ps-10 pe-10"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="absolute inset-y-0 end-3 my-auto text-white/25 hover:text-white/60"
          >
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
            {ar ? "دخول" : "Sign in"}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-white/40">
        {ar ? "ليس لديك حساب؟ " : "No account? "}
        <Link href={`/${locale}/patient/register`} className="text-cyan-400 hover:underline font-semibold">
          {ar ? "إنشاء حساب" : "Create account"}
        </Link>
      </p>
    </form>
  );
}
