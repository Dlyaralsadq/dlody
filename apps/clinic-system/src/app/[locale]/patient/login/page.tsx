import Link from "next/link";
import { getSession, getAuthenticatedRedirectPath, clearSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PatientLoginForm from "./PatientLoginForm";
import AuthShell from "@/components/layout/AuthShell";

export default async function PatientLoginPage({
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
    await clearSession();
  }

  return (
    <AuthShell
      locale={locale}
      accent="patient"
      title={ar ? "دخول المريض" : "Patient Sign In"}
      subtitle={ar ? "تابع مواعيدك واحجز بسهولة" : "Track appointments and book easily"}
      cardTitle={ar ? "مرحباً بعودتك" : "Welcome back"}
      cardSubtitle={ar ? "سجّل دخولك للمتابعة" : "Sign in to continue"}
      backHref={`/${locale}`}
      backLabel={ar ? "العودة للرئيسية" : "Back to home"}
      footer={
        <div className="flex flex-col items-center gap-3 text-sm">
          <Link href={`/${locale}/forgot-password`} className="text-cyan-400 hover:underline font-medium">
            {ar ? "نسيت كلمة المرور؟" : "Forgot password?"}
          </Link>
          <p className="text-app-3">
            {ar ? "ليس لديك حساب؟ " : "Don't have an account? "}
            <Link href={`/${locale}/patient/register`} className="text-cyan-400 hover:underline font-semibold">
              {ar ? "إنشاء حساب" : "Create account"}
            </Link>
          </p>
        </div>
      }
    >
      <PatientLoginForm locale={locale} />
    </AuthShell>
  );
}
