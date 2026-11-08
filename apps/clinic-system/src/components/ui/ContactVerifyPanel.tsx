"use client";

import { useState } from "react";
import { Mail, Phone, MessageSquare, CheckCircle2 } from "lucide-react";
import {
  requestContactVerification,
  confirmContactVerification,
  type ContactVerifyPurpose,
} from "@/app/actions/contactVerification";

type Step = "idle" | "code" | "done";

export default function ContactVerifyPanel({
  locale,
  initialEmail,
  initialPhone,
  emailVerified,
  phoneVerified,
  emailCodeSent = false,
}: {
  locale: string;
  initialEmail?: string | null;
  initialPhone?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  emailCodeSent?: boolean;
}) {
  const ar = locale === "ar";
  const [email, setEmail] = useState(initialEmail ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [emailDone, setEmailDone] = useState(emailVerified);
  const [phoneDone, setPhoneDone] = useState(phoneVerified);

  return (
    <div className="space-y-4">
      <VerifyBlock
        locale={locale}
        purpose="phone"
        title={ar ? "تأكيد رقم الهاتف عبر واتساب" : "Verify phone via WhatsApp"}
        hint={
          ar
            ? "سنرسل رمز تأكيد عبر رسالة واتساب إلى رقمك"
            : "We'll send a verification code to your number on WhatsApp"
        }
        value={phone}
        onValueChange={setPhone}
        verified={phoneDone}
        onVerified={() => setPhoneDone(true)}
        inputType="tel"
        placeholder="07XXXXXXXXX"
        Icon={Phone}
        channelIcon={MessageSquare}
      />
      <VerifyBlock
        locale={locale}
        purpose="email"
        title={ar ? "تأكيد البريد الإلكتروني" : "Verify email"}
        hint={
          ar
            ? "سنرسل رمز تأكيد من 6 أرقام إلى هذا البريد، صالح لمدة 10 دقائق"
            : "We'll email a 6-digit code to this address, valid for 10 minutes"
        }
        value={email}
        onValueChange={setEmail}
        verified={emailDone}
        onVerified={() => setEmailDone(true)}
        inputType="email"
        placeholder="name@gmail.com"
        startAtCode={emailCodeSent}
        Icon={Mail}
        channelIcon={Mail}
      />
    </div>
  );
}

function VerifyBlock({
  locale,
  purpose,
  title,
  hint,
  value,
  onValueChange,
  verified,
  onVerified,
  inputType,
  placeholder,
  Icon,
  channelIcon: ChannelIcon,
  startAtCode = false,
}: {
  locale: string;
  purpose: ContactVerifyPurpose;
  title: string;
  hint: string;
  value: string;
  onValueChange: (v: string) => void;
  verified: boolean;
  onVerified: () => void;
  inputType: "email" | "tel";
  placeholder: string;
  Icon: typeof Mail;
  channelIcon: typeof Mail;
  startAtCode?: boolean;
}) {
  const ar = locale === "ar";
  const [step, setStep] = useState<Step>(verified ? "done" : startAtCode ? "code" : "idle");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState<{ code: string; reason: string } | null>(null);
  const [hintDest, setHintDest] = useState("");

  const errMap: Record<string, string> = {
    unauthorized: ar ? "يجب تسجيل الدخول أولاً" : "Please sign in first",
    rate_limited: ar ? "طلبات كثيرة — حاول لاحقاً" : "Too many requests — try later",
    email_required: ar ? "أدخل بريداً صالحاً" : "Enter a valid email",
    unreal_email: ar ? "هذا البريد غير حقيقي أو لا يستقبل الرسائل" : "This email is not a real inbox",
    email_check_failed: ar ? "تعذر التحقق من نطاق البريد. حاول مرة أخرى" : "Could not check this email domain. Try again",
    phone_required: ar ? "أدخل رقماً صالحاً" : "Enter a valid phone number",
    delivery_failed: ar
      ? "تعذر إرسال الرمز. حاول لاحقاً"
      : "Could not send the code. Try again later",
    email_taken: ar ? "البريد مستخدم مسبقاً" : "Email already in use",
    phone_taken: ar ? "الرقم مستخدم مسبقاً" : "Phone already in use",
    invalid_code: ar ? "رمز غير صحيح أو منتهٍ" : "Invalid or expired code",
    too_many_attempts: ar ? "محاولات كثيرة — اطلب رمزاً جديداً" : "Too many attempts — request a new code",
  };

  async function sendCode() {
    setError("");
    setLoading(true);
    try {
      const r = await requestContactVerification(purpose, locale, value.trim() || undefined);
      if (!r.success) {
        setError(errMap[r.error ?? ""] ?? (ar ? "تعذر الإرسال" : "Could not send"));
        return;
      }
      setHintDest(r.destinationHint ?? "");
      setDevCode(r.devCode ? { code: r.devCode, reason: r.devReason ?? "" } : null);
      setStep("code");
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    setError("");
    setLoading(true);
    try {
      const r = await confirmContactVerification(purpose, code, locale);
      if (!r.success) {
        setError(errMap[r.error ?? ""] ?? (ar ? "رمز غير صحيح" : "Invalid code"));
        return;
      }
      setStep("done");
      onVerified();
    } finally {
      setLoading(false);
    }
  }

  if (step === "done" || verified) {
    return (
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-300">{title}</p>
          <p className="text-xs text-emerald-400/80 mt-0.5">
            {ar ? "تم التأكيد بنجاح" : "Verified successfully"}
            {value ? ` · ${value}` : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <ChannelIcon className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-white/40 mt-0.5">{hint}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
          {error}
        </div>
      )}

      {step === "idle" && (
        <>
          <div className="relative">
            <Icon className="absolute inset-y-0 start-3.5 my-auto h-4 w-4 text-white/25" />
            <input
              type={inputType}
              dir="ltr"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              className="form-input ps-10 pe-4"
              placeholder={placeholder}
            />
          </div>
          <button
            type="button"
            disabled={loading || !value.trim()}
            onClick={sendCode}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 disabled:opacity-50 transition-colors"
          >
            {loading
              ? ar
                ? "جاري الإرسال…"
                : "Sending…"
              : purpose === "phone"
                ? ar
                  ? "إرسال رمز واتساب"
                  : "Send WhatsApp code"
                : ar
                  ? "إرسال رمز إلى البريد"
                  : "Email me a code"}
          </button>
        </>
      )}

      {step === "code" && (
        <>
          <p className="text-xs text-white/45">
            {purpose === "phone"
              ? ar
                ? `أدخل الرمز المرسل عبر واتساب إلى ${hintDest || "هاتفك"}`
                : `Enter the WhatsApp code sent to ${hintDest || "your phone"}`
              : ar
                ? `أدخل الرمز المرسل إلى ${hintDest || "بريدك"}`
                : `Enter the code sent to ${hintDest || "your email"}`}
          </p>
          {devCode && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300 space-y-1.5">
              <p>{devCode.reason}</p>
              <p className="text-center text-xl font-black tracking-[0.35em] text-amber-200" dir="ltr">
                {devCode.code}
              </p>
            </div>
          )}
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            dir="ltr"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="form-input text-center text-lg tracking-[0.4em] font-bold"
            placeholder="••••••"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading || code.length !== 6}
              onClick={confirm}
              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2.5 disabled:opacity-50"
            >
              {loading ? (ar ? "…" : "…") : ar ? "تأكيد" : "Confirm"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={sendCode}
              className="rounded-xl border border-white/10 px-3 text-xs text-white/50 hover:text-white/80"
            >
              {ar ? "إعادة إرسال" : "Resend"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
