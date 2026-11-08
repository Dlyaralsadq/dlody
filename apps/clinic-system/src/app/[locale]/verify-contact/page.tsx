import { requireAuth } from "@/lib/auth";
import { getContactVerificationStatus } from "@/app/actions/contactVerification";
import ContactVerifyPanel from "@/components/ui/ContactVerifyPanel";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function VerifyContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const ar = locale === "ar";
  const session = await requireAuth(locale);
  const status = await getContactVerificationStatus(session.userId);

  const back =
    session.role === "patient"
      ? `/${locale}/patient/account`
      : session.role === "doctor"
        ? `/${locale}/doctor/settings`
        : session.role === "secretary"
          ? `/${locale}/secretary`
          : `/${locale}/admin`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-root)" }} dir={ar ? "rtl" : "ltr"}>
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-white">
            {ar ? "تأكيد التواصل" : "Verify contact"}
          </h1>
          <p className="text-sm text-white/40">
            {ar
              ? "أكد رقمك عبر واتساب وبريدك عبر رسالة نصية SMS"
              : "Confirm your phone via WhatsApp and your email via SMS"}
          </p>
        </div>

        <div className="card-glass rounded-3xl p-6">
          <ContactVerifyPanel
            locale={locale}
            initialEmail={status?.email}
            initialPhone={status?.phone}
            emailVerified={status?.emailVerified ?? false}
            phoneVerified={status?.phoneVerified ?? false}
          />
        </div>

        <p className="text-center">
          <Link
            href={back}
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70"
          >
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            {ar ? "متابعة لاحقاً" : "Continue later"}
          </Link>
        </p>
      </div>
    </div>
  );
}
