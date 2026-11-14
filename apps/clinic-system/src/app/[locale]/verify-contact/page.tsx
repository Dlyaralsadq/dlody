import { clearSession, getSession, getAuthenticatedRedirectPath } from "@/lib/auth";
import { getContactVerificationStatus } from "@/app/actions/contactVerification";
import ContactVerifyPanel from "@/components/ui/ContactVerifyPanel";
import { redirect } from "next/navigation";

export default async function VerifyContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { locale } = await params;
  const { sent } = await searchParams;
  const ar = locale === "ar";
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const status = await getContactVerificationStatus(session.userId);
  if (status?.emailVerified) {
    const dest = await getAuthenticatedRedirectPath(session, locale);
    redirect(dest ?? `/${locale}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-root)" }} dir={ar ? "rtl" : "ltr"}>
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-white">
            {ar ? "أكّد بريدك" : "Confirm your email"}
          </h1>
          <p className="text-sm text-white/40">
            {ar
              ? "أدخل الرمز الذي وصل إلى بريدك. الحساب يبقى مغلقاً حتى يتم التأكيد، ثم تختار اسم المستخدم."
              : "Enter the code sent to your inbox. The account stays closed until you confirm it, then you choose a username."}
          </p>
        </div>

        <div className="card-glass rounded-3xl p-6">
          <ContactVerifyPanel
            locale={locale}
            initialEmail={status?.email}
            emailVerified={false}
            emailCodeSent={sent === "email"}
            phoneVerified
            emailOnly
            refreshOnEmailVerified
          />
        </div>
        <form
          action={async () => {
            "use server";
            await clearSession();
            redirect(`/${locale}/login`);
          }}
          className="text-center"
        >
          <button type="submit" className="text-xs text-white/40 hover:text-white/70">
            {ar ? "خروج" : "Sign out"}
          </button>
        </form>
      </div>
    </div>
  );
}
