import Link from "next/link";
import AppLogo from "@/components/ui/AppLogo";
import { cn } from "@/lib/utils";

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

  return (
    <div
      className={cn("auth-page min-h-screen flex items-center justify-center p-4 sm:p-6", className)}
      dir={ar ? "rtl" : "ltr"}
    >
      {/* Back button — fixed top corner */}
      {backHref && (
        <Link
          href={backHref}
          className="fixed top-4 start-4 z-50 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:scale-[1.02] active:scale-95"
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
        <div className="text-center mb-8">
          <div className="inline-flex">
            <AppLogo size="lg" accent={accent} />
          </div>
          <h1 className="mt-5 text-2xl sm:text-3xl font-bold tracking-tight text-app-1">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-app-2 text-center max-w-xs mx-auto leading-relaxed">{subtitle}</p>
          )}
        </div>

        <div className="auth-card">
          {(cardTitle || cardSubtitle) && (
            <div className="mb-6 text-center">
              {cardTitle && <h2 className="text-base font-semibold text-app-1">{cardTitle}</h2>}
              {cardSubtitle && <p className="text-sm text-app-3 mt-1">{cardSubtitle}</p>}
            </div>
          )}
          {children}
        </div>

        {footer && <div className="mt-6">{footer}</div>}

        <p className="text-center text-xs text-app-3 mt-8 opacity-60">
          &copy; 2026 {ar ? "طبيبي" : "Tabibee"} · {ar ? "جميع الحقوق محفوظة" : "All rights reserved"}
        </p>
      </div>
    </div>
  );
}
