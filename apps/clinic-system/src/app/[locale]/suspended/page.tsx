import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";

export default async function SuspendedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) redirect(`/${locale}/login`);
  if (session.isActive) redirect(`/${locale}/${session.role === "doctor" ? "doctor" : "secretary"}`);

  const ar = locale === "ar";

  // Get admin contact (first admin user)
  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { name: true },
  });

  return (
    <div className="min-h-screen bg-[#060912] flex items-center justify-center p-4 overflow-hidden" dir={ar ? "rtl" : "ltr"}>

      {/* Ambient bg */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rose-600/6 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-amber-600/5 blur-[80px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="relative w-full max-w-md text-center space-y-8">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-600/30 to-amber-600/20 border border-rose-500/20 text-5xl">
              🔒
            </div>
            <div className="absolute -top-1 -end-1 h-5 w-5 rounded-full bg-rose-500 border-2 border-[#060912] flex items-center justify-center">
              <span className="text-white text-xs font-black leading-none">!</span>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-white">
            {ar ? "الحساب موقوف مؤقتاً" : "Account Suspended"}
          </h1>
          <p className="text-white/40 text-sm leading-relaxed">
            {ar
              ? "تم إيقاف حسابك مؤقتاً. للاستمرار في استخدام النظام، يرجى التواصل مع مدير النظام لتجديد الاشتراك."
              : "Your account has been temporarily suspended. Please contact the system administrator to renew your subscription."}
          </p>
        </div>

        {/* Info card */}
        <div className="rounded-2xl border border-white/6 bg-white/3 p-6 text-start space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/20">
              <span className="text-lg">👤</span>
            </div>
            <div>
              <p className="text-xs text-white/30 uppercase tracking-widest">{ar ? "الحساب" : "Account"}</p>
              <p className="text-sm font-semibold text-white">{session.name}</p>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/20 mt-0.5">
              <span className="text-lg">💳</span>
            </div>
            <div>
              <p className="text-xs text-white/30 uppercase tracking-widest mb-1">
                {ar ? "لتفعيل الحساب" : "To Reactivate"}
              </p>
              <p className="text-sm text-white/60 leading-relaxed">
                {ar
                  ? `تواصل مع مدير النظام ${admin?.name ? `(${admin.name})` : ""} لإتمام عملية الدفع وإعادة تفعيل حسابك.`
                  : `Contact the system administrator ${admin?.name ? `(${admin.name})` : ""} to complete the payment and reactivate your account.`}
              </p>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20 mt-0.5">
              <span className="text-lg">✅</span>
            </div>
            <div>
              <p className="text-xs text-white/30 uppercase tracking-widest mb-1">
                {ar ? "بعد الدفع" : "After Payment"}
              </p>
              <p className="text-sm text-white/60">
                {ar
                  ? "سيقوم المدير بإعادة تفعيل حسابك فوراً وستتمكن من الدخول والعمل بشكل طبيعي."
                  : "The administrator will reactivate your account immediately and you can resume normal operation."}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <form action={async () => {
            "use server";
            const { cookies } = await import("next/headers");
            (await cookies()).delete("clinic_session");
          }}>
            <button type="submit"
              className="w-full rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 px-5 py-3 text-sm font-medium text-white/60 hover:text-white transition-colors">
              {ar ? "تسجيل الخروج" : "Sign Out"}
            </button>
          </form>
        </div>

        <p className="text-xs text-white/15 font-mono">ClinicPro · {ar ? "إدارة العيادات الطبية" : "Clinic Management"}</p>
      </div>
    </div>
  );
}
