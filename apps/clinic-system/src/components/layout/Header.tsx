"use client";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const MessagingPanel = dynamic(() => import("@/components/ui/MessagingPanel"), { ssr: false });
import Link from "next/link";
import { Menu, Globe, LogOut, ChevronDown, ShieldCheck, Stethoscope, ClipboardList, Bell } from "lucide-react";
import { useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface HeaderProps { locale: string; userName?: string; onMenuToggle: () => void; role?: string; userId?: string; doctorLogoUrl?: string | null; messages?: any[]; unreadCount?: number; doctors?: any[]; adminUserId?: string; }

export default function Header({ locale, userName, onMenuToggle, role="admin", userId, doctorLogoUrl, messages, unreadCount, doctors, adminUserId }: HeaderProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const ar = locale === "ar";
  const other = ar ? "en" : "ar";
  const switchHref = role==="doctor" ? `/${other}/doctor` : role==="secretary" ? `/${other}/secretary` : `/${other}/admin`;
  const handleLogout = async () => { await logoutAction(); router.push(`/${locale}`); };

  const RoleIcon = role==="doctor" ? Stethoscope : role==="secretary" ? ClipboardList : ShieldCheck;
  const roleLabel = role==="doctor" ? (ar?"طبيب":"Doctor") : role==="secretary" ? (ar?"سكرتير":"Secretary") : (ar?"مدير":"Admin");
  const roleColor = role==="doctor" ? "text-violet-400" : role==="secretary" ? "text-cyan-400" : "text-indigo-400";
  const avatarGradient = role==="doctor" ? "from-violet-600 to-indigo-600" : role==="secretary" ? "from-cyan-600 to-blue-700" : "from-indigo-600 to-blue-700";

  return (
    <header
      className="sticky top-0 z-10 flex h-13 items-center gap-3 backdrop-blur-xl px-4"
      style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg-root) 90%, transparent)" }}
    >
      <button
        className="mobile-only lg:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-app-hover transition-colors"
        style={{ color: "var(--text-3)" }}
        onClick={onMenuToggle}
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Role pill */}
      <div
        className={cn("hidden lg:flex desktop-only items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", roleColor)}
        style={{ border: "1px solid var(--border)", background: "var(--bg-hover)" }}
      >
        <RoleIcon className="h-3 w-3" />{roleLabel}
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Link href={switchHref}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs bg-app-hover transition-colors"
          style={{ color: "var(--text-3)" }}>
          <Globe className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{other==="ar" ? "عربي" : "EN"}</span>
        </Link>

        {userId ? (
          <MessagingPanel
            userId={userId} role={role}
            messages={messages ?? []} unreadCount={unreadCount ?? 0}
            locale={locale} doctors={doctors} adminUserId={adminUserId}
          />
        ) : (
          <button className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-app-hover transition-colors" style={{ color: "var(--text-3)" }}>
            <Bell className="h-4 w-4" />
          </button>
        )}

        {/* User menu */}
        <div className="relative ms-1">
          <button onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 bg-app-hover transition-colors">
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg text-white text-xs font-bold bg-gradient-to-br overflow-hidden", avatarGradient)}>
              {(role === "doctor" || role === "secretary") && doctorLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={doctorLogoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                userName?.[0]?.toUpperCase() ?? "U"
              )}
            </div>
            <span className="hidden sm:block text-xs font-medium" style={{ color: "var(--text-2)" }}>{userName}</span>
            <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />
          </button>

          {showMenu && (
            <div
              className={cn("absolute top-full mt-2 w-48 rounded-2xl overflow-hidden py-1 z-50 shadow-2xl shadow-black/50", ar ? "left-0" : "right-0")}
              style={{ border: "1px solid var(--border)", background: "var(--bg-surface)" }}
            >
              <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>{userName}</p>
                <p className={cn("text-xs mt-0.5", roleColor)}>{roleLabel}</p>
              </div>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <ThemeToggle locale={locale} />
              </div>
              <button onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors">
                <LogOut className="h-3.5 w-3.5" />{ar ? "تسجيل الخروج" : "Sign Out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
