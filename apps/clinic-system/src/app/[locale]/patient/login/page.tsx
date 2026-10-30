import Link from "next/link";
import { getSession, getAuthenticatedRedirectPath, clearSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PatientLoginForm from "./PatientLoginForm";

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
    <div
      className="min-h-screen bg-[#060912] flex items-center justify-center p-4"
      dir={ar ? "rtl" : "ltr"}
    >
      <div className="relative w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-600 text-3xl shadow-xl">
            👤
          </div>
          <h1 className="mt-4 text-2xl font-black text-white">
            {ar ? "دخول المريض" : "Patient Sign In"}
          </h1>
          <p className="mt-1 text-sm text-white/40">
            {ar ? "تابع مواعيدك واحجز بسهولة" : "Track appointments and book easily"}
          </p>
        </div>

        <div className="card-glass rounded-3xl p-7">
          <PatientLoginForm locale={locale} />
        </div>

        <div className="mt-6 flex justify-center gap-4 text-xs">
          <Link href={`/${locale}/patient`} className="text-white/40 hover:text-white/70">
            {ar ? "← العودة للخريطة" : "← Back to map"}
          </Link>
          <Link href={`/${locale}`} className="text-white/40 hover:text-white/70">
            {ar ? "الرئيسية" : "Home"}
          </Link>
        </div>
      </div>
    </div>
  );
}
