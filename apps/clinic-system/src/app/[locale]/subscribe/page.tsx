import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Lock, Phone, Star, Zap, Calendar, Users,
  MapPin, ClipboardList, MessageCircle, Bell, Heart, Clock,
  FileText, BarChart3, Search,
} from "lucide-react";
import { getDoctorByUserId } from "@/app/actions/doctorPortal";
import { getSubscriptionPricing } from "@/app/actions/subscription";

function formatIqd(amount: number, ar: boolean) {
  return `${amount.toLocaleString("en-US")} ${ar ? "د.ع" : "IQD"}`;
}

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

  const [doctor, pricing] = await Promise.all([
    session.role === "doctor" ? getDoctorByUserId(session.userId) : Promise.resolve(null),
    getSubscriptionPricing(),
  ]);

  const yearlyFull = pricing.monthlyPrice * 12;
  const yearlySave = yearlyFull - pricing.yearlyPrice;

  const freeFeatures = [
    { icon: Star, text: ar ? "إنشاء حساب الطبيب وإضافة التخصص والترخيص" : "Create a doctor account with specialty and license" },
    { icon: MapPin, text: ar ? "إضافة الشعار وموقع العيادة على الخريطة" : "Add your logo and clinic location on the map" },
    { icon: Heart, text: ar ? "الظهور للمرضى واستقبال الحجوزات أونلاين" : "Appear to patients and receive online bookings" },
    { icon: ClipboardList, text: ar ? "نشر المنشورات والقصص لتعريف المرضى بعيادتك" : "Publish posts and stories so patients can find you" },
  ];

  const paidFeatures = [
    { icon: Zap, text: ar ? "كل مميزات الخطة المجانية" : "Everything in the free plan" },
    { icon: Users, text: ar ? "عدد غير محدود من المرضى بملف طبي كامل" : "Unlimited patients with a full medical file" },
    { icon: FileText, text: ar ? "التاريخ المرضي، الملاحظات السريرية، التشخيصات، ورفع الصور والتحاليل وPDF" : "History, clinical notes, diagnoses, and image, lab, and PDF uploads" },
    { icon: Calendar, text: ar ? "حجوزات غير محدودة، تقويم العيادة، قوائم الانتظار، وتذكير المواعيد" : "Unlimited bookings, a clinic calendar, waiting lists, and appointment reminders" },
    { icon: BarChart3, text: ar ? "تقارير الشهر وتتبع الإيرادات المحصّلة" : "Monthly reports and collected revenue" },
    { icon: Search, text: ar ? "تخصيص صفحة العيادة وأولوية الظهور في البحث" : "A custom clinic page and priority in search results" },
    { icon: ClipboardList, text: ar ? "لوحة الاستقبال وحساب سكرتير مستقل" : "Reception desk and a separate secretary account" },
    { icon: Clock, text: ar ? "المرضى الدائمون وجدولة موعد الزيارة القادمة" : "Recurring patients and the next-visit schedule" },
    { icon: Heart, text: ar ? "متابعة تقييمات المرضى وإعدادات العيادة وساعات العمل" : "Patient ratings, clinic settings, and working hours" },
    { icon: MessageCircle, text: ar ? "مراسلة فريق الدعم عند حدوث مشكلة" : "Message the support team when something goes wrong" },
    { icon: Bell, text: ar ? "تنبيهات النظام وتذكير انتهاء الاشتراك" : "System alerts and a reminder before the subscription ends" },
  ];

  return (
    <div
      className="min-h-screen px-4 py-10"
      style={{ background: "var(--bg-root)" }}
      dir={ar ? "rtl" : "ltr"}
    >
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 mb-4">
            <Lock size={30} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-white">
            {ar ? "نظام إدارة العيادة" : "Clinic management"}
          </h1>
          <p className="text-white/50 text-sm mt-2 max-w-lg mx-auto leading-relaxed">
            {doctor
              ? (ar
                ? `مرحباً ${doctor.nameAr}. حسابك ظاهر للمرضى، وإدارة العيادة الكاملة تتفعّل بعد الاشتراك.`
                : `Welcome ${doctor.name}. Patients can already find you. Full clinic management unlocks after you subscribe.`)
              : (ar
                ? "الحساب المجاني يُظهرك للمرضى. الاشتراك يفتح أدوات تشغيل العيادة."
                : "The free account lists you for patients. A subscription opens the tools that run the clinic.")}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 mb-6">
          <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
            <p className="text-xs font-semibold text-white/45">{ar ? "اشتراك شهري" : "Monthly"}</p>
            <p className="mt-2 text-3xl font-black text-white">{formatIqd(pricing.monthlyPrice, ar)}</p>
            <p className="mt-1 text-xs text-white/40">{ar ? "يُدفع كل شهر" : "Billed every month"}</p>
          </div>
          <div className="rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-5 relative">
            {yearlySave > 0 && (
              <span className="absolute top-3 end-3 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                {ar ? `وفّر ${formatIqd(yearlySave, ar)}` : `Save ${formatIqd(yearlySave, ar)}`}
              </span>
            )}
            <p className="text-xs font-semibold text-indigo-300">{ar ? "اشتراك سنوي" : "Yearly"}</p>
            <p className="mt-2 text-3xl font-black text-white">{formatIqd(pricing.yearlyPrice, ar)}</p>
            <p className="mt-1 text-xs text-white/40">
              {ar ? "دفعة واحدة لمدة 12 شهراً" : "One payment for 12 months"}
              {yearlySave > 0 && (
                <span className="block mt-0.5 text-white/25 line-through">
                  {formatIqd(yearlyFull, ar)}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 mb-6">
          <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star size={15} className="text-white/40" />
              <p className="text-sm font-bold text-white/70">{ar ? "مجاني" : "Free"}</p>
            </div>
            <ul className="space-y-3">
              {freeFeatures.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5 text-sm text-white/55 leading-relaxed">
                  <Icon size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-indigo-500/40 bg-indigo-500/8 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={15} className="text-indigo-400" />
              <p className="text-sm font-bold text-indigo-200">{ar ? "اشتراك العيادة" : "Clinic plan"}</p>
            </div>
            <ul className="space-y-3">
              {paidFeatures.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5 text-sm text-white/70 leading-relaxed">
                  <Icon size={14} className="text-indigo-300 shrink-0 mt-0.5" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 mb-4 text-center">
          <Phone size={20} className="text-cyan-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white mb-1">
            {ar ? "للاشتراك تواصل مع مدير المنصة وأرسل إثبات الدفع" : "Contact the platform admin and send proof of payment"}
          </p>
          <p className="text-xs text-white/40 leading-relaxed">
            {ar
              ? "بعد تأكيد الدفع يفعّل المدير اشتراكك شهرياً أو سنوياً، وتُفتح لوحة الطبيب والاستقبال والمرضى."
              : "After payment is confirmed, the admin activates a monthly or yearly subscription and your doctor, reception, and patient tools open."}
          </p>
        </div>

        <Link
          href={`/${locale}/doctor/settings`}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/4 py-3 text-sm font-semibold text-white/70 hover:text-white hover:border-white/20 transition"
        >
          {ar ? "أضف موقعك ومعلوماتك الآن" : "Add your info and location now"}
        </Link>

        <div className="mt-4 text-center">
          <Link href={`/${locale}/login`} className="text-xs text-white/20 hover:text-white/40 transition">
            {ar ? "تسجيل الخروج" : "Sign out"}
          </Link>
        </div>
      </div>
    </div>
  );
}
