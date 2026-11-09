"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, KeyRound } from "lucide-react";
import { requestPasswordReset, resetPasswordWithCode } from "@/app/actions/passwordReset";

type Step = "identify" | "verify" | "done";

export default function ForgotPasswordForm({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const [step, setStep] = useState<Step>("identify");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultRole, setResultRole] = useState<string | undefined>();
  const [devCode, setDevCode] = useState<{ code: string; reason: string } | null>(null);

  const errorMap: Record<string, string> = {
    invalid_code: ar ? "الرمز غير صحيح أو منتهي الصلاحية" : "Invalid or expired code",
    too_many_attempts: ar ? "محاولات كثيرة جداً — اطلب رمزاً جديداً" : "Too many attempts — request a new code",
    weak_password: ar ? "كلمة المرور يجب ألا تقل عن 6 أحرف" : "Password must be at least 6 characters",
    mismatch: ar ? "كلمتا المرور غير متطابقتين" : "Passwords don't match",
  };

  async function handleIdentify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!identifier.trim()) return;
    setLoading(true);
    try {
      const r = await requestPasswordReset(identifier.trim(), locale);
      setDevCode(r.devCode ? { code: r.devCode, reason: r.devReason ?? "" } : null);
      setStep("verify");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError(errorMap.mismatch);
      return;
    }
    setLoading(true);
    try {
      const r = await resetPasswordWithCode(identifier.trim(), code.trim(), password);
      if (r.success) {
        setResultRole(r.role);
        setStep("done");
      } else {
        setError(errorMap[r.error ?? ""] ?? (ar ? "حدث خطأ" : "Something went wrong"));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setLoading(true);
    try {
      const r = await requestPasswordReset(identifier.trim(), locale);
      setDevCode(r.devCode ? { code: r.devCode, reason: r.devReason ?? "" } : null);
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    const loginHref =
      resultRole === "patient" ? `/${locale}/patient/login` : `/${locale}/login`;
    return (
      <div className="text-center py-4">
        <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
        <p className="text-white font-bold">{ar ? "تم تحديث كلمة المرور بنجاح" : "Password updated successfully"}</p>
        <p className="text-white/40 text-sm mt-1">{ar ? "يمكنك الآن تسجيل الدخول" : "You can now sign in"}</p>
        <Link
          href={loginHref}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          {ar ? "تسجيل الدخول" : "Sign in"}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <form onSubmit={handleReset} className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-3 text-xs text-indigo-300">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            {ar
              ? "إذا كان هذا الحساب موجوداً، تم إرسال رمز تحقق مكوّن من 6 أرقام. صالح لمدة 10 دقائق."
              : "If that account exists, a 6-digit verification code was sent. It's valid for 10 minutes."}
          </span>
        </div>

        {devCode && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-300 space-y-2">
            <p className="flex items-start gap-2">
              <KeyRound className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{devCode.reason}</span>
            </p>
            <p className="text-center text-2xl font-black tracking-[0.4em] text-amber-200" dir="ltr">
              {devCode.code}
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="form-label">{ar ? "رمز التحقق" : "Verification code"}</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            dir="ltr"
            required
            className="form-input text-center text-2xl font-black tracking-[0.5em]"
            placeholder="••••••"
            maxLength={6}
          />
        </div>

        <div className="space-y-1.5">
          <label className="form-label">{ar ? "كلمة المرور الجديدة" : "New password"}</label>
          <div className="relative">
            <Lock className="absolute inset-y-0 start-3.5 my-auto h-4 w-4 text-white/25" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPwd ? "text" : "password"}
              required
              minLength={6}
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

        <div className="space-y-1.5">
          <label className="form-label">{ar ? "تأكيد كلمة المرور" : "Confirm password"}</label>
          <div className="relative">
            <Lock className="absolute inset-y-0 start-3.5 my-auto h-4 w-4 text-white/25" />
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              type={showPwd ? "text" : "password"}
              required
              minLength={6}
              className="form-input ps-10 pe-4"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            ar ? "تحديث كلمة المرور" : "Update password"
          )}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          className="w-full text-center text-xs text-indigo-400 hover:underline"
        >
          {ar ? "إعادة إرسال الرمز" : "Resend code"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleIdentify} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="form-label">{ar ? "البريد الإلكتروني" : "Email"}</label>
        <div className="relative">
          <Mail className="absolute inset-y-0 start-3.5 my-auto h-4 w-4 text-white/25" />
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            dir="ltr"
            className="form-input ps-10 pe-4"
            type="email"
            placeholder="name@gmail.com"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>
            {ar ? "إرسال رمز التحقق" : "Send verification code"}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </>
        )}
      </button>
    </form>
  );
}
