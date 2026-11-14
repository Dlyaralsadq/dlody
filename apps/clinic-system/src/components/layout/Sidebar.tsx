"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Calendar, ClipboardList, ShieldCheck, ChevronRight, Heart, Settings, Rss, HeadphonesIcon, CalendarDays, BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { getSpecialtyIcon } from "@/lib/specialtyIcons";
import ScrollSpacer from "@/components/ui/ScrollSpacer";
import { SCROLL_CONTAINER } from "@/lib/scrollUi";

interface SidebarProps { locale: string; isOpen: boolean; onClose: () => void; role?: string; doctorSpecialty?: string; doctorLogoUrl?: string | null; recurringPatientsEnabled?: boolean; recurringCount?: number; supportUnread?: number; }

export default function Sidebar({ locale, isOpen, onClose, role="admin", doctorSpecialty, doctorLogoUrl, recurringPatientsEnabled = true, recurringCount, supportUnread = 0 }: SidebarProps) {
  const tn = useTranslations("nav");
  const ta = useTranslations("admin");
  const td = useTranslations("doctorPortal");
  const pathname = usePathname();
  const ar = locale === "ar";

  const adminNav = [
    {
      section: null as string | null,
      items: [
        { href: `/${locale}/admin`, icon: ShieldCheck, label: ta("title"), exact: true },
        { href: `/${locale}/specialties`, icon: ClipboardList, label: tn("specialties") },
        { href: `/${locale}/admin/support`, icon: HeadphonesIcon, label: ar ? "دعم العملاء" : "Customer Support", badge: supportUnread || undefined },
        { href: `/${locale}/admin/account`, icon: Settings, label: ar ? "الحساب" : "Account" },
      ],
    },
  ];
  const doctorNav = [
    {
      section: ar ? "العيادة" : "Clinic",
      items: [
        { href: `/${locale}/doctor`, icon: LayoutDashboard, label: ar ? "لوحة الطبيب" : "Dashboard", exact: true },
        { href: `/${locale}/secretary`, icon: ClipboardList, label: ar ? "الاستقبال" : "Reception" },
        { href: `/${locale}/doctor/patients`, icon: Users, label: td("myPatients") },
        { href: `/${locale}/doctor/appointments`, icon: Calendar, label: ar ? "سجل المواعيد" : "Archive" },
        { href: `/${locale}/clinic/calendar`, icon: CalendarDays, label: ar ? "تقويم العيادة" : "Calendar" },
        { href: `/${locale}/clinic/reports`, icon: BarChart3, label: ar ? "التقارير" : "Reports" },
        ...(recurringPatientsEnabled ? [{ href: `/${locale}/doctor/recurring`, icon: Users, label: recurringCount && recurringCount > 0 ? (ar ? `المرضى الدائمون (${recurringCount})` : `Recurring (${recurringCount})`) : (ar ? "المرضى الدائمون" : "Recurring") }] : []),
      ],
    },
    {
      section: ar ? "الحساب" : "Account",
      items: [
        { href: `/${locale}/doctor/posts`, icon: Rss, label: ar ? "المحتوى" : "Content" },
        { href: `/${locale}/doctor/settings`, icon: Settings, label: ar ? "الإعدادات" : "Settings" },
      ],
    },
  ];
  const secretaryNav = [
    {
      section: null as string | null,
      items: [
        { href: `/${locale}/secretary`, icon: ClipboardList, label: ar ? "الاستقبال" : "Reception", exact: true },
        { href: `/${locale}/clinic/calendar`, icon: CalendarDays, label: ar ? "تقويم العيادة" : "Calendar" },
        { href: `/${locale}/clinic/reports`, icon: BarChart3, label: ar ? "التقارير" : "Reports" },
      ],
    },
  ];

  // Inject supportUnread badge into admin nav
  if (role === "admin" && supportUnread > 0) {
    const supportItem = adminNav[0].items.find(i => i.href.includes("/support"));
    if (supportItem) (supportItem as any).badge = supportUnread;
  }

  const navItems = role==="doctor" ? doctorNav : role==="secretary" ? secretaryNav : adminNav;
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname===href : pathname===href || pathname.startsWith(href+"/");

  const specialtyEmoji = doctorSpecialty ? getSpecialtyIcon(doctorSpecialty) : "🩺";
  const roleColor = role==="doctor" ? "from-violet-600 to-indigo-600" : role==="secretary" ? "from-cyan-600 to-blue-700" : "from-indigo-600 to-blue-700";
  const showDoctorLogo = (role === "doctor" || role === "secretary") && doctorLogoUrl;

  return (
    <>
      {isOpen && <div className="mobile-only lg:hidden fixed inset-0 z-20 bg-black/60 backdrop-blur-sm" onClick={onClose} />}

      {/* `lg:static lg:translate-x-0` is a width-based fallback that always works even if
          device detection is unavailable; `desktop-static` additionally forces the same
          result on a real desktop even when its browser window is narrower than `lg`. */}
      <aside className={cn(
        "desktop-static fixed inset-y-0 z-30 flex w-60 flex-col transition-transform duration-300 lg:static lg:translate-x-0",
        locale==="ar"
          ? cn("right-0", isOpen ? "translate-x-0" : "translate-x-full")
          : cn("left-0", isOpen ? "translate-x-0" : "-translate-x-full")
      )}
        style={{
          background: "linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-root) 100%)",
          borderInlineEnd: "1px solid var(--border)",
        }}
      >

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg text-base overflow-hidden", roleColor)}>
            {showDoctorLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={doctorLogoUrl!} alt="" className="h-full w-full object-cover" />
            ) : (role === "doctor" || role === "secretary") ? specialtyEmoji : <Heart className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight" style={{ color: "var(--text-1)" }}>{ar ? "طبيبي" : "Tabibee"}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              {role==="doctor" ? (ar ? "بوابة الطبيب" : "Doctor Portal")
                : role==="secretary" ? (ar ? "الاستقبال" : "Reception")
                : (ar ? "الإدارة" : "Admin")}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className={`flex-1 px-3 py-4 space-y-4 ${SCROLL_CONTAINER}`}>
          {navItems.map((group, gi) => (
            <div key={group.section ?? gi} className="space-y-0.5">
              {group.section && (
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                  {group.section}
                </p>
              )}
              {group.items.map(({ href, icon: Icon, label, exact, ...rest }) => {
                const active = isActive(href, exact);
                const badge = (rest as any).badge as number | undefined;
                return (
                  <Link key={href} href={href} onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group bg-app-hover",
                      active
                        ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/25"
                        : undefined
                    )}
                    style={active ? undefined : { color: "var(--text-2)" }}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active && "text-indigo-400")} style={active ? undefined : { color: "var(--text-3)" }} />
                    <span className="flex-1 text-sm">{label}</span>
                    {badge && badge > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold px-1">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    ) : active && <ChevronRight className="h-3.5 w-3.5 opacity-40 rtl:rotate-180" />}
                  </Link>
                );
              })}
            </div>
          ))}
          <ScrollSpacer variant="modal" />
        </nav>

        <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs font-mono" style={{ color: "var(--text-3)" }}>Tabibee · v1.0</p>
        </div>
      </aside>
    </>
  );
}
