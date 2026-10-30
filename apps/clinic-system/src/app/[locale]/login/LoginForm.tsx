"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Eye, EyeOff, Lock, User2, ArrowRight } from "lucide-react";

export default function LoginForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const ar = locale === "ar";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const result = await loginAction(new FormData(e.currentTarget));
    if (result.success) {
      const role = result.role;
      const dest =
        role === "doctor" ? "doctor"
        : role === "secretary" ? "secretary"
        : role === "patient" ? "patient/account"
        : "admin";
      router.push(`/${locale}/${dest}`);
      router.refresh();
    } else {
      setError(ar ? "اسم المستخدم أو كلمة المرور غير صحيحة" : "Invalid username or password");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs text-rose-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />{error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="form-label">{ar ? "اسم المستخدم" : "Username"}</label>
        <div className="relative">
          <User2 className="absolute inset-y-0 start-3.5 my-auto h-4 w-4 text-white/25" />
          <input name="username" type="text" required autoComplete="username"
            className="form-input ps-10 pe-4"
            placeholder={ar ? "اسم المستخدم" : "username"} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="form-label">{ar ? "كلمة المرور" : "Password"}</label>
        <div className="relative">
          <Lock className="absolute inset-y-0 start-3.5 my-auto h-4 w-4 text-white/25" />
          <input name="password" type={showPwd ? "text" : "password"} required autoComplete="current-password"
            className="form-input ps-10 pe-10"
            placeholder="••••••••" />
          <button type="button" onClick={() => setShowPwd(!showPwd)}
            className="absolute inset-y-0 end-3 my-auto text-white/25 hover:text-white/60 transition-colors">
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold py-2.5 mt-2 transition-all shadow-lg shadow-indigo-950/60 disabled:opacity-50">
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>
            {ar ? "تسجيل الدخول" : "Sign In"}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </>
        )}
      </button>

      {/* Demo credentials */}
      <div className="rounded-xl border border-white/6 bg-white/3 p-4 space-y-2">
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">{ar ? "حسابات تجريبية" : "Demo Accounts"}</p>
        <div className="space-y-1.5 text-xs">
          {[
            { role: ar?"مدير":"Admin", user:"admin", color:"text-indigo-400" },
            { role: ar?"طبيب":"Doctor", user:"dr.ahmad", color:"text-violet-400" },
            { role: ar?"سكرتير":"Secretary", user:"secretary1", color:"text-cyan-400" },
          ].map(({ role, user, color }) => (
            <div key={user} className="flex items-center gap-2">
              <span className={`font-semibold ${color} w-16 shrink-0`}>{role}</span>
              <code className="text-white/50">{user}</code>
              <span className="text-white/20">/</span>
              <code className="text-white/50">admin123</code>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
