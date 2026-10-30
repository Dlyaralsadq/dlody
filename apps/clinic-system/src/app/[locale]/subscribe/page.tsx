import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock, CheckCircle, Phone, Star, Zap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getDoctorByUserId } from "@/app/actions/doctorPortal";

export default async function SubscribePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const ar = locale === "ar";
  const session = await getSession();

  if (!session) redirect(`/${locale}/login`);
  if (session.role === "admin") redirect(`/${locale}/admin`);

  // Get doctor info
  const doctor = session.role === "doctor"
    ? await getDoctorByUserId(session.userId)
    : null;

  // Admin phone for contact
  const adminUser = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { name: true },
  });

  return (
    <div
      className="min-h-screen bg-[#060912] flex items-center justify-center p-4"
      dir={ar ? "rtl" : "ltr"}
    >
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Lock icon */}
        <div className="text-center mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 mb-4">
            <Lock size={36} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-white">
            {ar ? "اشتراك مطلوب" : "Subscription Required"}
          </h1>
          {doctor && (
            <p className="text-white/50 text-sm mt-2">
              {ar ? `مرحباً دكتور ${doctor.nameAr}` : `Welcome Dr. ${doctor.name}`}
            </p>
          )}
        </div>

        {/* Free vs Paid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Free */}
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star size={14} className="text-white/40" />
              <p className="text-xs font-bold text-white/60">{ar ? "مجاني" : "Free"}</p>
            </div>
            <ul className="space-y-2">
              {[
                ar ? "إنشاء حساب" : "Create account",
                ar ? "إضافة معلوماتك" : "Add your info",
                ar ? "الظهور على الخريطة" : "Appear on map",
                ar ? "استقبال حجوزات أونلاين" : "Receive online bookings",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-white/50">
                  <CheckCircle size={11} className="text-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Paid */}
          <div className="rounded-2xl border border-indigo-500/40 bg-indigo-500/8 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-indigo-400" />
              <p className="text-xs font-bold text-indigo-300">{ar ? "مدفوع" : "Paid"}</p>
            </div>
            <ul className="space-y-2">
              {[
                ar ? "كل المميزات المجانية" : "All free features",
                ar ? "إدارة المرضى" : "Patients management",
                ar ? "إدارة المواعيد" : "Appointments",
                ar ? "لوحة السكرتير" : "Secretary panel",
                ar ? "الزيارات والفواتير" : "Visits & invoices",
                ar ? "التقارير والإحصائيات" : "Reports & stats",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-white/60">
                  <CheckCircle size={11} className="text-indigo-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact admin */}
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 mb-5 text-center">
          <Phone size={20} className="text-cyan-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white mb-1">
            {ar ? "للاشتراك تواصل مع مدير المنصة" : "Contact platform admin to subscribe"}
          </p>
          <p className="text-xs text-white/40">
            {ar ? "بعد الدفع سيتم تفعيل نظام إدارة العيادة لديك" : "After payment, your clinic system will be activated"}
          </p>
        </div>

        {/* Go to settings to set location */}
        <Link
          href={`/${locale}/doctor/settings`}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/4 py-3 text-sm font-semibold text-white/70 hover:text-white hover:border-white/20 transition"
        >
          {ar ? "أضف موقعك ومعلوماتك الآن ←" : "→ Add your info & location now"}
        </Link>

        <div className="mt-4 text-center">
          <Link
            href={`/${locale}/login`}
            className="text-xs text-white/20 hover:text-white/40 transition"
          >
            {ar ? "تسجيل الخروج" : "Sign out"}
          </Link>
        </div>
      </div>
    </div>
  );
}
