import { getSession, getAuthenticatedRedirectPath } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import DoctorRegisterForm from "./DoctorRegisterForm";
import ScrollSpacer from "@/components/ui/ScrollSpacer";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const ar = locale === "ar";
  const session = await getSession();

  if (session) {
    const dest = await getAuthenticatedRedirectPath(session, locale);
    if (dest) redirect(dest);
    redirect(`/api/session/clear?next=/${locale}/register`);
  }

  const specialties = await prisma.specialty.findMany({
    where: { isActive: true },
    orderBy: { nameAr: "asc" },
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-root)" }} dir={ar ? "rtl" : "ltr"}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-lg px-4 py-8">
        {/* Back */}
        <Link href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition mb-6">
          <ArrowRight size={15} className={ar ? "" : "rotate-180"} />
          {ar ? "العودة" : "Back"}
        </Link>

        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-3xl mb-4 border border-white/5 shadow-lg shadow-indigo-950/60">
            🩺
          </div>
          <h1 className="text-2xl font-black text-white">
            {ar ? "تسجيل كطبيب" : "Register as a Doctor"}
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {ar
              ? "أنشئ حسابك مجاناً وابدأ الظهور على خريطة المرضى"
              : "Create your free account and start appearing on the patient map"}
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <DoctorRegisterForm specialties={specialties} locale={locale} />
        </div>

        {/* Already have account */}
        <p className="text-center text-xs text-white/30 mt-5">
          {ar ? "لديك حساب؟ " : "Already have an account? "}
          <Link href={`/${locale}/login`} className="text-indigo-400 hover:underline">
            {ar ? "تسجيل الدخول" : "Sign in"}
          </Link>
        </p>
      </div>
      <ScrollSpacer variant="page" />
    </div>
  );
}
