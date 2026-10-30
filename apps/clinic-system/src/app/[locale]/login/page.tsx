import { getSession, getAuthenticatedRedirectPath, clearSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LoginForm from "./LoginForm";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getSession();
  if (session) {
    const dest = await getAuthenticatedRedirectPath(session, locale);
    if (dest) redirect(dest);
    await clearSession();
  }

  const ar = locale === "ar";

  return (
    <div className="min-h-screen bg-[#060912] flex items-center justify-center p-4 overflow-hidden" dir={ar ? "rtl" : "ltr"}>

      {/* Ambient light effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-violet-600/8 blur-[80px] rounded-full" />
        <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-cyan-600/5 blur-[80px] rounded-full" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="relative w-full max-w-[400px]">

        {/* Logo mark */}
        <div className="text-center mb-10">
          <div className="inline-flex relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 shadow-2xl shadow-indigo-950/80 text-4xl">
              🏥
            </div>
            <span className="absolute -top-1 -end-1 h-4 w-4 rounded-full bg-cyan-400 border-2 border-[#060912] animate-pulse" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-white">
            {ar ? "كلينيك برو" : "ClinicPro"}
          </h1>
          <p className="mt-1 text-sm text-white/35">
            {ar ? "نظام إدارة العيادات الطبية" : "Medical Clinic Management System"}
          </p>
        </div>

        {/* Card */}
        <div className="card-glass rounded-3xl p-8">
          <div className="mb-7">
            <h2 className="text-lg font-bold text-white">{ar ? "مرحباً بعودتك" : "Welcome back"}</h2>
            <p className="text-sm text-white/35 mt-1">{ar ? "سجّل دخولك للمتابعة" : "Sign in to continue"}</p>
          </div>
          <LoginForm locale={locale} />
        </div>

        <p className="text-center text-xs text-white/40 mt-6">
          {ar ? "طبيب جديد؟ " : "New doctor? "}
          <Link href={`/${locale}/register`} className="text-indigo-400 hover:underline font-semibold">
            {ar ? "سجّل حسابك مجاناً" : "Create your free account"}
          </Link>
        </p>

        <p className="text-center mt-4">
          <Link href={`/${locale}`} className="text-xs text-white/40 hover:text-white/70 inline-flex items-center gap-1">
            ← {ar ? "العودة للصفحة الرئيسية" : "Back to home"}
          </Link>
        </p>

        <p className="text-center text-xs text-white/15 mt-4">
          &copy; 2026 ClinicPro · {ar ? "جميع الحقوق محفوظة" : "All rights reserved"}
        </p>
      </div>
    </div>
  );
}
