import { redirect } from "next/navigation";
import { getSession, getAuthenticatedRedirectPath } from "@/lib/auth";
import Link from "next/link";
import {
  Stethoscope,
  User,
  MapPin,
  CalendarDays,
  Bell,
  Shield,
  Search,
  ChevronRight,
  Star,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (session) {
    const dest = await getAuthenticatedRedirectPath(session, locale);
    if (dest) redirect(dest);
    redirect(`/api/session/clear?next=/${locale}`);
  }

  const ar = locale === "ar";

  const features = [
    {
      icon: MapPin,
      color: "#6366f1",
      glow: "rgba(99,102,241,.18)",
      titleAr: "خريطة الأطباء",
      titleEn: "Doctors Map",
      descAr: "اكتشف الأطباء في محافظتك على خريطة تفاعلية بالموقع الدقيق للعيادة",
      descEn: "Find doctors in your governorate on an interactive map with exact clinic locations",
    },
    {
      icon: CalendarDays,
      color: "#22d3ee",
      glow: "rgba(34,211,238,.15)",
      titleAr: "حجز المواعيد",
      titleEn: "Easy Booking",
      descAr: "احجز موعدك في دقائق واحصل على تأكيد فوري مع تذكيرات تلقائية",
      descEn: "Book your appointment in minutes with instant confirmation and automatic reminders",
    },
    {
      icon: Search,
      color: "#10b981",
      glow: "rgba(16,185,129,.15)",
      titleAr: "استكشاف طبي",
      titleEn: "Medical Discovery",
      descAr: "تابع منشورات الأطباء، تعرف على تخصصاتهم، وابحث بالاسم أو التخصص",
      descEn: "Follow doctor posts, learn about specialties, and search by name or specialty",
    },
    {
      icon: Bell,
      color: "#f59e0b",
      glow: "rgba(245,158,11,.15)",
      titleAr: "إشعارات فورية",
      titleEn: "Instant Alerts",
      descAr: "لا تفوّت موعدك — إشعارات تذكير قبل موعدك مباشرةً",
      descEn: "Never miss an appointment — timely reminders delivered right to you",
    },
    {
      icon: Shield,
      color: "#8b5cf6",
      glow: "rgba(139,92,246,.18)",
      titleAr: "بيانات مؤمّنة",
      titleEn: "Secure Data",
      descAr: "بياناتك الصحية محمية بأعلى معايير الأمان والخصوصية",
      descEn: "Your health data is protected with the highest security and privacy standards",
    },
    {
      icon: Stethoscope,
      color: "#f43f5e",
      glow: "rgba(244,63,94,.15)",
      titleAr: "نظام إدارة العيادات",
      titleEn: "Clinic Management",
      descAr: "للأطباء: إدارة شاملة للمرضى والجداول والتقارير في مكان واحد",
      descEn: "For doctors: full patient, schedule, and report management in one place",
    },
  ];

  const steps = [
    {
      num: "١",
      numEn: "1",
      titleAr: "أنشئ حسابك",
      titleEn: "Create your account",
      descAr: "سجّل كمريض أو طبيب في أقل من دقيقة",
      descEn: "Sign up as a patient or doctor in under a minute",
    },
    {
      num: "٢",
      numEn: "2",
      titleAr: "اكتشف أو أضف عيادتك",
      titleEn: "Discover or add your clinic",
      descAr: "ابحث عن الأطباء أو أضف بيانات عيادتك",
      descEn: "Search for doctors or add your clinic details",
    },
    {
      num: "٣",
      numEn: "3",
      titleAr: "احجز أو استقبل مواعيد",
      titleEn: "Book or receive appointments",
      descAr: "جدولة المواعيد بضغطة واحدة",
      descEn: "One-tap appointment scheduling",
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-root)", color: "var(--text-1)" }}
      dir={ar ? "rtl" : "ltr"}
    >
      {/* ════════════════════════════
          HERO
      ════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 pt-24 pb-16 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[140px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-violet-600/8 blur-[100px] rounded-full" />
          <div className="absolute top-1/3 left-0 w-[350px] h-[350px] bg-cyan-600/6 blur-[80px] rounded-full" />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.018]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
        </div>

        {/* Language switcher — top corner */}
        <div className="absolute top-5 end-5 flex gap-2 z-10">
          <Link
            href="/ar"
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              locale === "ar"
                ? "border-indigo-500/50 text-indigo-300 bg-indigo-500/10"
                : "border-white/10 text-white/30 hover:text-white/60"
            }`}
          >
            العربية
          </Link>
          <Link
            href="/en"
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              locale === "en"
                ? "border-indigo-500/50 text-indigo-300 bg-indigo-500/10"
                : "border-white/10 text-white/30 hover:text-white/60"
            }`}
          >
            English
          </Link>
        </div>

        {/* Logo badge */}
        <div className="relative mb-8 flex flex-col items-center gap-4">
          <div className="relative inline-flex">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-[2rem] text-5xl shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6, #22d3ee)",
                boxShadow: "0 24px 64px rgba(99,102,241,.45)",
              }}
            >
              🏥
            </div>
            <span className="absolute -top-1 -end-1 h-5 w-5 rounded-full bg-cyan-400 border-2 border-[#060912] animate-pulse" />
          </div>

          {/* Badge */}
          <div
            className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
            style={{
              border: "1px solid rgba(99,102,241,.3)",
              background: "rgba(99,102,241,.1)",
              color: "#a5b4fc",
            }}
          >
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {ar ? "منصة طبية رقمية #١ في العراق" : "Iraq's #1 Digital Medical Platform"}
          </div>
        </div>

        {/* Headline */}
        <h1
          className="text-center text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight max-w-3xl"
          style={{
            background: "linear-gradient(135deg, #f0f4ff 30%, #a5b4fc 70%, #67e8f9)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {ar ? "طبيبي" : "Tabibee"}
        </h1>

        <p className="mt-5 text-center text-xl sm:text-2xl font-bold text-white/70 max-w-xl leading-snug">
          {ar
            ? "ابحث عن الطبيب المناسب، احجز موعدك، وتابع صحتك"
            : "Find the right doctor, book your appointment, and manage your health"}
        </p>
        <p className="mt-3 text-center text-sm text-white/35 max-w-md leading-relaxed">
          {ar
            ? "منصة رقمية تربط المرضى بأطباء العراق — احجز، اكتشف، وتابع كل شيء من مكان واحد"
            : "A digital platform connecting patients with Iraq's doctors — book, discover, and manage everything in one place"}
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-sm mx-auto">
          <Link
            href={`/${locale}/patient`}
            className="group flex flex-1 items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 active:scale-98"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: "0 8px 32px rgba(99,102,241,.45)",
            }}
          >
            <User size={18} />
            {ar ? "أنا مريض" : "I'm a Patient"}
            <ChevronRight size={16} className={ar ? "rotate-180" : ""} />
          </Link>
          <Link
            href={`/${locale}/login`}
            className="group flex flex-1 items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-98"
            style={{
              border: "1px solid rgba(255,255,255,.12)",
              background: "rgba(255,255,255,.05)",
              color: "var(--text-1)",
            }}
          >
            <Stethoscope size={18} />
            {ar ? "أنا طبيب / موظف" : "Doctor / Staff"}
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-14 grid grid-cols-3 gap-6 max-w-sm w-full mx-auto">
          {[
            { n: ar ? "+٢٥٠٠" : "2500+", label: ar ? "طبيب" : "Doctors" },
            { n: ar ? "١٨" : "18",        label: ar ? "محافظة" : "Governorates" },
            { n: ar ? "٢٤/٧" : "24/7",   label: ar ? "خدمة" : "Service" },
          ].map(({ n, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-2xl font-black text-white">{n}</span>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce opacity-30">
          <div className="h-8 w-5 rounded-full border border-white/30 flex items-start justify-center pt-1.5">
            <div className="h-1.5 w-1 rounded-full bg-white/60" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          FEATURES
      ════════════════════════════ */}
      <section className="px-5 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14 mx-auto">
          <p
            className="text-xs font-bold tracking-widest uppercase mb-3"
            style={{ color: "#6366f1" }}
          >
            {ar ? "لماذا طبيبي؟" : "Why Tabibee?"}
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            {ar ? "كل ما تحتاجه في مكان واحد" : "Everything you need in one place"}
          </h2>
          <p className="mt-3 text-sm text-white/40 max-w-md mx-auto leading-relaxed">
            {ar
              ? "منصة متكاملة صُمِّمت خصيصاً لتلبية احتياجات المرضى والأطباء في العراق"
              : "A complete platform designed specifically for the needs of patients and doctors in Iraq"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, color, glow, titleAr, titleEn, descAr, descEn }) => (
            <div
              key={titleEn}
              className="group rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              style={{
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl mb-5 transition-transform duration-200 group-hover:scale-110"
                style={{
                  background: `color-mix(in srgb, ${color} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                  boxShadow: `0 4px 20px ${glow}`,
                }}
              >
                <Icon size={22} style={{ color }} />
              </div>
              <h3 className="font-bold text-white text-base mb-2">
                {ar ? titleAr : titleEn}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>
                {ar ? descAr : descEn}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════
          HOW IT WORKS
      ════════════════════════════ */}
      <section
        className="px-5 py-20"
        style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14 mx-auto">
            <p
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{ color: "#22d3ee" }}
            >
              {ar ? "كيف يعمل؟" : "How it works"}
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              {ar ? "ثلاث خطوات بسيطة" : "Three simple steps"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative place-items-center sm:place-items-start">
            {/* Connector line */}
            <div
              className="hidden sm:block absolute top-8 start-[18%] end-[18%] h-px"
              style={{ background: "linear-gradient(to end, transparent, var(--border), var(--border), transparent)" }}
            />

            {steps.map(({ num, numEn, titleAr, titleEn, descAr, descEn }, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-4 relative">
                <div
                  className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black text-white"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    boxShadow: "0 8px 24px rgba(99,102,241,.4)",
                  }}
                >
                  {ar ? num : numEn}
                </div>
                <h3 className="font-bold text-white text-base">{ar ? titleAr : titleEn}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>
                  {ar ? descAr : descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          FOR PATIENTS / FOR DOCTORS
      ════════════════════════════ */}
      <section className="px-5 py-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For patients */}
          <div
            className="rounded-3xl p-8 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,.12) 0%, rgba(139,92,246,.08) 100%)",
              border: "1px solid rgba(99,102,241,.2)",
            }}
          >
            <div className="absolute -top-8 -end-8 w-32 h-32 rounded-full blur-3xl bg-indigo-500/20 pointer-events-none" />
            <div
              className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-6"
              style={{ background: "rgba(99,102,241,.2)", border: "1px solid rgba(99,102,241,.3)" }}
            >
              <User size={26} className="text-indigo-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">
              {ar ? "للمرضى" : "For Patients"}
            </h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>
              {ar
                ? "كل ما تحتاجه للعثور على الطبيب المناسب وحجز موعدك"
                : "Everything you need to find the right doctor and book your appointment"}
            </p>
            <ul className="space-y-3 mb-8">
              {[
                ar ? "بحث سريع بالاسم أو التخصص أو المنطقة" : "Quick search by name, specialty, or area",
                ar ? "خريطة تفاعلية لعيادات قريبة منك" : "Interactive map of clinics near you",
                ar ? "استعراض ملفات الأطباء والتقييمات" : "Browse doctor profiles and ratings",
                ar ? "حجز مباشر وتأكيد فوري" : "Direct booking with instant confirmation",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-2)" }}>
                  <CheckCircle2 size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={`/${locale}/patient`}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              {ar ? "ابدأ الآن" : "Get started"}
              <ChevronRight size={16} className={ar ? "rotate-180" : ""} />
            </Link>
          </div>

          {/* For doctors */}
          <div
            className="rounded-3xl p-8 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(34,211,238,.08) 0%, rgba(16,185,129,.06) 100%)",
              border: "1px solid rgba(34,211,238,.15)",
            }}
          >
            <div className="absolute -top-8 -start-8 w-32 h-32 rounded-full blur-3xl bg-cyan-500/15 pointer-events-none" />
            <div
              className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-6"
              style={{ background: "rgba(34,211,238,.15)", border: "1px solid rgba(34,211,238,.25)" }}
            >
              <Stethoscope size={26} className="text-cyan-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">
              {ar ? "للأطباء والعيادات" : "For Doctors & Clinics"}
            </h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>
              {ar
                ? "نظام متكامل لإدارة عيادتك وتوسيع قاعدة مرضاك"
                : "Complete system to manage your clinic and grow your patient base"}
            </p>
            <ul className="space-y-3 mb-8">
              {[
                ar ? "جدولة المواعيد وإدارة التقويم" : "Appointment scheduling and calendar management",
                ar ? "ملفات المرضى الإلكترونية" : "Electronic patient records",
                ar ? "نشر محتوى طبي للمرضى" : "Publish medical content for patients",
                ar ? "تقارير وإحصائيات العيادة" : "Clinic reports and statistics",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-2)" }}>
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={`/${locale}/register`}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #22d3ee, #10b981)" }}
            >
              {ar ? "سجّل عيادتك مجاناً" : "Register your clinic free"}
              <ChevronRight size={16} className={ar ? "rotate-180" : ""} />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          ABOUT / FOOTER CTA
      ════════════════════════════ */}
      <section
        className="px-5 py-20"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="inline-flex h-16 w-16 items-center justify-center rounded-3xl text-3xl mx-auto mb-6"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: "0 12px 40px rgba(99,102,241,.4)",
            }}
          >
            🏥
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {ar ? "من نحن" : "About Tabibee"}
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-2)" }}>
            {ar
              ? "طبيبي منصة طبية رقمية عراقية تهدف إلى تسهيل الوصول إلى الرعاية الصحية. نربط المرضى بالأطباء من جميع محافظات العراق، ونوفر لهم أدوات حجز مواعيد سهلة وبيانات طبية موثوقة. للأطباء، نوفر نظام إدارة عيادات متكاملاً يساعدهم على تنظيم عملهم وتوسيع خدماتهم."
              : "Tabibee is an Iraqi digital medical platform designed to simplify access to healthcare. We connect patients with doctors from all Iraqi governorates, providing easy appointment booking tools and reliable medical data. For doctors, we offer a comprehensive clinic management system to organize their work and expand their services."}
          </p>

          {/* Final CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mx-auto">
            <Link
              href={`/${locale}/patient`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-bold text-white transition hover:opacity-90 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 8px 32px rgba(99,102,241,.4)",
              }}
            >
              <User size={18} />
              {ar ? "ابدأ كمريض" : "Start as Patient"}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-bold transition hover:-translate-y-0.5"
              style={{
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(255,255,255,.04)",
                color: "var(--text-1)",
              }}
            >
              <Stethoscope size={18} />
              {ar ? "دخول الطاقم الطبي" : "Medical Staff Login"}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-5 py-6 text-center"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex flex-wrap items-center justify-center gap-4 mb-3 mx-auto">
          <Link href="/ar" className="text-xs hover:text-white transition" style={{ color: "var(--text-3)" }}>العربية</Link>
          <span style={{ color: "var(--border)" }}>·</span>
          <Link href="/en" className="text-xs hover:text-white transition" style={{ color: "var(--text-3)" }}>English</Link>
          <span style={{ color: "var(--border)" }}>·</span>
          <Link href={`/${locale}/patient`} className="text-xs hover:text-white transition" style={{ color: "var(--text-3)" }}>
            {ar ? "بوابة المريض" : "Patient Portal"}
          </Link>
          <span style={{ color: "var(--border)" }}>·</span>
          <Link href={`/${locale}/login`} className="text-xs hover:text-white transition" style={{ color: "var(--text-3)" }}>
            {ar ? "دخول الأطباء" : "Doctor Login"}
          </Link>
        </div>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          &copy; 2026 {ar ? "طبيبي" : "Tabibee"} ·{" "}
          {ar ? "جميع الحقوق محفوظة" : "All rights reserved"}
        </p>
      </footer>
    </div>
  );
}
