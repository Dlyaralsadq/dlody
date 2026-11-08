import Link from "next/link";
import { getSession, getAuthenticatedRedirectPath, clearSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PatientRegisterForm from "./PatientRegisterForm";

export default async function PatientRegisterPage({
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-root)" }} dir={ar ? "rtl" : "ltr"}>
      <div className="relative w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-600 text-3xl shadow-xl">
            ✨
          </div>
          <h1 className="mt-4 text-2xl font-black text-white">
            {ar ? "حساب مريض جديد" : "Create Patient Account"}
          </h1>
          <p className="mt-1 text-sm text-white/40">
            {ar ? "مجاني — لإدارة مواعيدك بسهولة" : "Free — manage your appointments easily"}
          </p>
        </div>

        <div className="card-glass rounded-3xl p-7">
          <PatientRegisterForm locale={locale} />
        </div>

        <p className="mt-6 text-center">
          <Link href={`/${locale}/patient`} className="text-xs text-white/40 hover:text-white/70">
            {ar ? "← العودة للخريطة" : "← Back to map"}
          </Link>
        </p>
      </div>
    </div>
  );
}
