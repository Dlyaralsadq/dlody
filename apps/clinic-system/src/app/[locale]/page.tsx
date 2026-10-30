import { redirect } from "next/navigation";
import { getSession, getAuthenticatedRedirectPath, clearSession } from "@/lib/auth";
import Link from "next/link";
import { Stethoscope, User } from "lucide-react";

export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (session) {
    const dest = await getAuthenticatedRedirectPath(session, locale);
    if (dest) redirect(dest);
    await clearSession();
  }

  const ar = locale === "ar";

  return (
    <div
      className="min-h-screen bg-[#060912] flex flex-col items-center justify-center p-6"
      dir={ar ? "rtl" : "ltr"}
    >
      {/* ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-violet-600/8 blur-[80px] rounded-full" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-cyan-600/5 blur-[80px] rounded-full" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 shadow-2xl shadow-indigo-950/80 text-4xl">
              🏥
            </div>
            <span className="absolute -top-1 -end-1 h-4 w-4 rounded-full bg-cyan-400 border-2 border-[#060912] animate-pulse" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-white">
            {ar ? "كلينيك برو" : "ClinicPro"}
          </h1>
          <p className="mt-2 text-sm text-white/40">
            {ar
              ? "منصة إدارة العيادات الطبية — العراق"
              : "Medical Clinic Management Platform — Iraq"}
          </p>
        </div>

        {/* Choice cards */}
        <p className="text-center text-white/50 text-sm mb-6">
          {ar ? "اختر كيف تريد الدخول" : "How would you like to continue?"}
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Doctor card */}
          <Link
            href={`/${locale}/login`}
            className="group relative flex flex-col items-center gap-4 rounded-2xl border border-white/8 bg-white/4 p-8 text-center transition-all duration-200 hover:border-indigo-500/50 hover:bg-indigo-500/8 hover:shadow-lg hover:shadow-indigo-950/40"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-950/60 transition-transform group-hover:scale-105">
              <Stethoscope size={30} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {ar ? "طبيب / موظف" : "Doctor / Staff"}
              </h2>
              <p className="mt-1 text-xs text-white/40">
                {ar
                  ? "دخول إلى نظام إدارة العيادة"
                  : "Access clinic management system"}
              </p>
            </div>
            <span className="absolute bottom-4 end-4 text-indigo-400/0 transition-all group-hover:text-indigo-400/80 text-lg">
              ←
            </span>
          </Link>

          {/* Patient card */}
          <Link
            href={`/${locale}/patient`}
            className="group relative flex flex-col items-center gap-4 rounded-2xl border border-white/8 bg-white/4 p-8 text-center transition-all duration-200 hover:border-cyan-500/50 hover:bg-cyan-500/8 hover:shadow-lg hover:shadow-cyan-950/40"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-600 shadow-lg shadow-cyan-950/60 transition-transform group-hover:scale-105">
              <User size={30} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {ar ? "مريض" : "Patient"}
              </h2>
              <p className="mt-1 text-xs text-white/40">
                {ar
                  ? "ابحث عن طبيب واحجز موعدك"
                  : "Find a doctor and book an appointment"}
              </p>
            </div>
            <span className="absolute bottom-4 end-4 text-cyan-400/0 transition-all group-hover:text-cyan-400/80 text-lg">
              ←
            </span>
          </Link>
        </div>

        {/* Language switcher */}
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/ar"
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              locale === "ar"
                ? "border-indigo-500/50 text-indigo-300 bg-indigo-500/10"
                : "border-white/10 text-white/30 hover:text-white/60"
            }`}
          >
            العربية
          </Link>
          <Link
            href="/en"
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              locale === "en"
                ? "border-indigo-500/50 text-indigo-300 bg-indigo-500/10"
                : "border-white/10 text-white/30 hover:text-white/60"
            }`}
          >
            English
          </Link>
        </div>

        <p className="text-center text-xs text-white/15 mt-8">
          &copy; 2026 ClinicPro ·{" "}
          {ar ? "جميع الحقوق محفوظة" : "All rights reserved"}
        </p>
      </div>
    </div>
  );
}
