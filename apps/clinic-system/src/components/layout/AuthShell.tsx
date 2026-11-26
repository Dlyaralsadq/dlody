import Link from "next/link";
import AppLogo from "@/components/ui/AppLogo";
import { cn } from "@/lib/utils";
import { Shield, Clock, MapPin, Stethoscope, User, CalendarDays } from "lucide-react";

interface AuthShellProps {
  locale: string;
  accent?: "staff" | "patient";
  title: string;
  subtitle?: string;
  cardTitle?: string;
  cardSubtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  wide?: boolean;
  className?: string;
}

const STAFF_FEATURES = [
  { icon: CalendarDays, ar: "إدارة المواعيد بكل سهولة", en: "Manage appointments effortlessly" },
  { icon: Stethoscope, ar: "ملفات المرضى الرقمية",     en: "Digital patient records" },
  { icon: Shield,       ar: "بيانات مؤمّنة ومحمية",    en: "Secure & protected data" },
];

const PATIENT_FEATURES = [
  { icon: MapPin,       ar: "اكتشف الأطباء قريبًا منك",  en: "Discover nearby doctors" },
  { icon: CalendarDays, ar: "احجز موعدك في دقيقة",        en: "Book appointments in minutes" },
  { icon: Clock,        ar: "تذكيرات وإشعارات فورية",    en: "Instant reminders & notifications" },
];

export default function AuthShell({
  locale,
  accent = "staff",
  title,
  subtitle,
  cardTitle,
  cardSubtitle,
  children,
  footer,
  backHref,
  backLabel,
  wide = false,
  className,
}: AuthShellProps) {
  const ar = locale === "ar";
  const isPatient = accent === "patient";
  const features = isPatient ? PATIENT_FEATURES : STAFF_FEATURES;

  const gradientFrom = isPatient ? "#0c1d2e" : "#0a0d1e";
  const accentColor  = isPatient ? "#22d3ee" : "#6366f1";
  const accentGlow   = isPatient ? "rgba(34,211,238,.18)" : "rgba(99,102,241,.18)";

  return (
    <div
      className={cn("auth-page min-h-screen flex", className)}
      dir={ar ? "rtl" : "ltr"}
      style={{ background: "var(--bg-root)" }}
    >
      {/* ── Left / Right branding panel (md+) ── */}
      <div
        className="hidden md:flex md:w-[42%] lg:w-[45%] flex-col justify-between p-10 relative overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${gradientFrom} 0%, var(--bg-root) 100%)`,
          borderInlineEnd: "1px solid var(--border)",
        }}
      >
        {/* Ambient glows */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
        >
          <div
            className="absolute -top-24 -start-24 w-96 h-96 rounded-full blur-[120px] opacity-50"
            style={{ background: accentGlow }}
          />
          <div
            className="absolute bottom-0 end-0 w-72 h-72 rounded-full blur-[80px] opacity-30"
            style={{ background: "rgba(139,92,246,.14)" }}
          />
          {/* subtle dot grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,.8) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        {/* Top: logo */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-2xl shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)`,
                boxShadow: `0 8px 24px ${accentGlow}`,
              }}
            >
              🏥
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-white">
                {ar ? "طبيبي" : "Tabibee"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                {ar ? "منصة طبية رقمية — العراق" : "Digital Medical Platform — Iraq"}
              </p>
            </div>
          </div>
        </div>

        {/* Middle: headline + features */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-black text-white leading-snug">
              {isPatient
                ? (ar ? "صحتك بأيدٍ أمينة" : "Your health, in safe hands")
                : (ar ? "إدارة عيادتك بذكاء" : "Manage your clinic smarter")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
              {isPatient
                ? (ar
                    ? "احجز مع أفضل الأطباء في العراق، تابع مواعيدك، واستفد من منشورات طبية موثوقة."
                    : "Book with top doctors in Iraq, track appointments, and access trusted medical content.")
                : (ar
                    ? "نظام متكامل لإدارة المواعيد والمرضى والتقارير — كل ما تحتاجه في مكان واحد."
                    : "All-in-one system for appointments, patients, and reports — everything in one place.")}
            </p>
          </div>

          <ul className="space-y-4">
            {features.map(({ icon: Icon, ar: labelAr, en: labelEn }) => (
              <li key={labelEn} className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)`,
                  }}
                >
                  <Icon size={16} style={{ color: accentColor }} />
                </span>
                <span className="text-sm font-medium text-white/80">
                  {ar ? labelAr : labelEn}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: trust badge */}
        <div
          className="relative flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: "rgba(255,255,255,.04)", border: "1px solid var(--border)" }}
        >
          <User size={15} style={{ color: "var(--text-3)" }} />
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            {isPatient
              ? (ar ? "آلاف المرضى يثقون بطبيبي يومياً" : "Thousands of patients trust Tabibee daily")
              : (ar ? "أطباء من جميع محافظات العراق" : "Doctors from all Iraqi governorates")}
          </p>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center p-5 sm:p-8 relative">

        {/* Back button */}
        {backHref && (
          <Link
            href={backHref}
            className="absolute top-4 start-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:scale-[1.02] active:scale-95"
            style={{
              border: "1px solid var(--border)",
              background: "color-mix(in srgb, var(--bg-surface) 90%, transparent)",
              color: "var(--text-2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="rtl:rotate-180 text-base leading-none">←</span>
            {backLabel ?? (ar ? "العودة" : "Back")}
          </Link>
        )}

        <div className={cn("relative w-full animate-fade-up", wide ? "max-w-lg" : "max-w-[420px]")}>

          {/* Logo — visible on mobile only (panel hidden) */}
          <div className="text-center mb-8 md:hidden">
            <div className="inline-flex">
              <AppLogo size="lg" accent={accent} />
            </div>
            <h1 className="mt-5 text-2xl sm:text-3xl font-bold tracking-tight text-app-1">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-app-2 text-center max-w-xs mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Title — visible on wide screens alongside the panel */}
          <div className="hidden md:block text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-app-1">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-sm text-app-2 max-w-xs mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Card */}
          <div className="auth-card">
            {(cardTitle || cardSubtitle) && (
              <div className="mb-6 text-center">
                {cardTitle && (
                  <h2 className="text-base font-semibold text-app-1">{cardTitle}</h2>
                )}
                {cardSubtitle && (
                  <p className="text-sm text-app-3 mt-1">{cardSubtitle}</p>
                )}
              </div>
            )}
            {children}
          </div>

          {footer && <div className="mt-6">{footer}</div>}

          <p className="text-center text-xs text-app-3 mt-8 opacity-50">
            &copy; 2026 {ar ? "طبيبي" : "Tabibee"} ·{" "}
            {ar ? "جميع الحقوق محفوظة" : "All rights reserved"}
          </p>
        </div>
      </div>
    </div>
  );
}
