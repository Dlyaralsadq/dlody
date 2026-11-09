"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { claimUsername } from "@/app/actions/register";

export default function ChooseUsernameForm({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await claimUsername(username, locale);
      if (result.success) {
        router.push(result.redirectTo ?? `/${locale}`);
        router.refresh();
        return;
      }
      const msgs: Record<string, string> = {
        invalid_username: ar
          ? "استخدم 3 إلى 24 حرفاً، ويبدأ بحرف إنجليزي"
          : "Use 3–24 characters, starting with a letter",
        username_taken: ar ? "اسم المستخدم محجوز" : "Username already taken",
        email_unverified: ar ? "أكّد البريد أولاً" : "Confirm your email first",
        unauthorized: ar ? "سجّل الدخول بالبريد أولاً" : "Sign in with your email first",
      };
      setError(msgs[result.error ?? ""] ?? (ar ? "تعذر حفظ الاسم" : "Could not save the username"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <label className="form-label">{ar ? "اسم المستخدم" : "Username"}</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          dir="ltr"
          autoComplete="username"
          placeholder="dr.ahmed"
          className="form-input"
        />
      </div>
      <button
        type="submit"
        disabled={loading || username.trim().length < 3}
        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 disabled:opacity-50"
      >
        {loading ? (ar ? "جاري الحفظ…" : "Saving…") : ar ? "فتح الحساب" : "Open account"}
      </button>
    </form>
  );
}
