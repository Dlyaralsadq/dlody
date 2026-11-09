import { clearSession, getSession, getAuthenticatedRedirectPath } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { needsChosenUsername } from "@/lib/usernamePolicy";
import { redirect } from "next/navigation";
import ChooseUsernameForm from "./ChooseUsernameForm";

export default async function ChooseUsernamePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const ar = locale === "ar";
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { emailVerified: true, username: true },
  });
  if (!user?.emailVerified) redirect(`/${locale}/verify-contact`);
  if (!needsChosenUsername(user.username)) {
    const dest = await getAuthenticatedRedirectPath(session, locale);
    redirect(dest ?? `/${locale}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-root)" }} dir={ar ? "rtl" : "ltr"}>
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-white">
            {ar ? "اختر اسم المستخدم" : "Choose a username"}
          </h1>
          <p className="text-sm text-white/40">
            {ar
              ? "البريد مؤكد. اختر اسم المستخدم لفتح الحساب. الدخول بعد ذلك يبقى بالبريد."
              : "Your email is confirmed. Choose a username to open the account. Sign-in stays on email."}
          </p>
        </div>
        <div className="card-glass rounded-3xl p-6">
          <ChooseUsernameForm locale={locale} />
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
