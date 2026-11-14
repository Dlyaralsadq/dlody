"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MapPin, Bookmark, User, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const HIDE_PATHS = ["/login", "/register", "/book/"];

export default function PatientAppShell() {
  const pathname = usePathname();
  const locale = pathname.match(/^\/(ar|en)\/patient/)?.[1] ?? "ar";
  const ar = locale === "ar";

  const base = `/${locale}/patient`;
  const hidden = HIDE_PATHS.some((p) => pathname.includes(`${base}${p}`));
  if (hidden) return null;

  const tabs = [
    { href: `${base}/updates`, icon: Home, label: ar ? "الرئيسية" : "Home" },
    { href: `${base}/explore`, icon: Search, label: ar ? "استكشاف" : "Explore" },
    { href: `${base}`, icon: MapPin, label: ar ? "الخريطة" : "Map", exact: true },
    { href: `${base}/saved`, icon: Bookmark, label: ar ? "محفوظ" : "Saved" },
    { href: `${base}/account`, icon: User, label: ar ? "حسابي" : "Profile" },
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Mobile: bottom tab bar. `lg:hidden` is a width-based fallback that always
          works; `mobile-only` additionally hides it on a real desktop even when its
          window is narrower than `lg`. */}
      <nav
        className="mobile-only lg:hidden fixed bottom-0 inset-x-0 z-[9999] backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.45)]"
        style={{ borderTop: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg-root) 98%, transparent)" }}
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {tabs.map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-1 flex-col items-center gap-0.5 py-1.5 rounded-xl transition bg-app-hover"
                style={{ color: active ? "var(--text-1)" : "var(--text-3)" }}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? "text-indigo-400" : undefined}
                />
                <span className={cn("text-[10px] font-medium", active && "text-indigo-300")}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop: fixed side rail — modern app shell rather than a stretched-out mobile nav.
          `hidden lg:flex` is the safe width-based fallback; `force-desktop-flex` additionally
          shows it on a real desktop even when its window is narrower than `lg`. */}
      <aside
        className={cn(
          "hidden lg:flex force-desktop-flex fixed inset-y-0 z-[9999] w-60 flex-col",
          ar ? "right-0" : "left-0"
        )}
        style={{
          background: "var(--bg-surface)",
          [ar ? "borderLeft" : "borderRight"]: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg">
            <Heart className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight" style={{ color: "var(--text-1)" }}>{ar ? "طبيبي" : "Tabibee"}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{ar ? "بوابة المريض" : "Patient Portal"}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {tabs.map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group bg-app-hover",
                  active && "bg-indigo-600/20 text-indigo-300 border border-indigo-500/25"
                )}
                style={active ? undefined : { color: "var(--text-2)" }}
              >
                <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active && "text-indigo-400")} style={active ? undefined : { color: "var(--text-3)" }} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
