import { getSession, getAuthenticatedRedirectPath, clearSession } from "@/lib/auth";

import { redirect } from "next/navigation";

import Link from "next/link";

import LoginForm from "./LoginForm";

import AuthShell from "@/components/layout/AuthShell";



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

    <AuthShell

      locale={locale}

      accent="staff"

      title={ar ? "طبيبي" : "Tabibee"}

      subtitle={ar ? "نظام إدارة العيادات الطبية" : "Medical Clinic Management System"}

      cardTitle={ar ? "مرحباً بعودتك" : "Welcome back"}

      cardSubtitle={ar ? "سجّل دخولك للمتابعة" : "Sign in to continue"}

      backHref={`/${locale}`}

      backLabel={ar ? "العودة للصفحة الرئيسية" : "Back to home"}

      footer={

        <p className="text-center text-sm text-app-3">

          {ar ? "طبيب جديد؟ " : "New doctor? "}

          <Link href={`/${locale}/register`} className="text-indigo-400 hover:underline font-semibold">

            {ar ? "سجّل حسابك مجاناً" : "Create your free account"}

          </Link>

        </p>

      }

    >

      <LoginForm locale={locale} />

    </AuthShell>

  );

}

