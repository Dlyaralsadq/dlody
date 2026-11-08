import Link from "next/link";

import ForgotPasswordForm from "./ForgotPasswordForm";

import AuthShell from "@/components/layout/AuthShell";



export default async function ForgotPasswordPage({

  params,

}: {

  params: Promise<{ locale: string }>;

}) {

  const { locale } = await params;

  const ar = locale === "ar";



  return (

    <AuthShell

      locale={locale}

      accent="staff"

      title={ar ? "استعادة كلمة المرور" : "Reset your password"}

      subtitle={

        ar

          ? "أدخل رقم هاتفك أو بريدك الإلكتروني وسنرسل لك رمز التحقق"

          : "Enter your phone or email and we'll send you a verification code"

      }

      backHref={`/${locale}/login`}

      backLabel={ar ? "العودة لتسجيل الدخول" : "Back to sign in"}

    >

      <ForgotPasswordForm locale={locale} />

    </AuthShell>

  );

}

