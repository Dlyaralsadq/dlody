"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Calendar, Stethoscope, ClipboardList, ShieldCheck, ChevronRight, Heart, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { getSpecialtyIcon } from "@/lib/specialtyIcons";

interface SidebarProps { locale: string; isOpen: boolean; onClose: () => void; role?: string; doctorSpecialty?: string; recurringCount?: number; }

export default function Sidebar({ locale, isOpen, onClose, role="admin", doctorSpecialty, recurringCount }: SidebarProps) {
  const tn = useTranslations("nav");
  const ta = useTranslations("admin");
  const td = useTranslations("doctorPortal");
  const pathname = usePathname();
  const ar = locale === "ar";

  const adminNav = [
    { href: `/${locale}/admin`, icon: ShieldCheck, label: ta("title"), exact: true },
    { href: `/${locale}/specialties`, icon: ClipboardList, label: tn("specialties") },
  ];
  const doctorNav = [
    { href: `/${locale}/doctor`, icon: LayoutDashboard, label: ar ? "لوحة الطبيب" : "Dashboard", exact: true },
    { href: `/${locale}/secretary`, icon: ClipboardList, label: ar ? "الاستقبال" : "Reception" },
    { href: `/${locale}/doctor/patients`, icon: Users, label: td("myPatients") },
    { href: `/${locale}/doctor/appointments`, icon: Calendar, label: ar ? "سجل المواعيد" : "Archive" },
    ...(recurringCount && recurringCount > 0 ? [{ href: `/${locale}/doctor/recurring`, icon: Users, label: ar ? `المرضى الدائمون (${recurringCount})` : `Recurring (${recurringCount})` }] : []),
    { href: `/${locale}/doctor/settings`, icon: Settings, label: ar ? "الإعدادات" : "Settings" },
  ];
  const secretaryNav = [
    { href: `/${locale}/secretary`, icon: ClipboardList, label: ar ? "الاستقبال" : "Reception", exact: true },
  ];

  const navItems = role==="doctor" ? doctorNav : role==="secretary" ? secretaryNav : adminNav;
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname===href : pathname===href || pathname.startsWith(href+"/");

  const specialtyEmoji = doctorSpecialty ? getSpecialtyIcon(doctorSpecialty) : "🩺";
  const roleColor = role==="doctor" ? "from-violet-600 to-indigo-600" : "from-indigo-600 to-blue-700";

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} />}

      <aside className={cn(
        "fixed inset-y-0 z-30 flex w-60 flex-col sidebar-bg transition-transform duration-300 lg:static lg:translate-x-0",
        locale==="ar"
          ? cn("right-0", isOpen ? "translate-x-0" : "translate-x-full")
          : cn("left-0", isOpen ? "translate-x-0" : "-translate-x-full")
      )}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg text-base", roleColor)}>
            {role==="doctor" ? specialtyEmoji : <Heart className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">{ar ? "كلينيك برو" : "ClinicPro"}</p>
            <p className="text-xs text-white/30 mt-0.5">
              {role==="doctor" ? (ar ? "بوابة الطبيب" : "Doctor Portal")
                : role==="secretary" ? (ar ? "الاستقبال" : "Reception")
                : (ar ? "الإدارة" : "Admin")}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link key={href} href={href} onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group",
                  active
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/25"
                    : "text-white/35 hover:text-white/80 hover:bg-white/4"
                )}>
                <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-indigo-400" : "text-white/25 group-hover:text-white/50")} />
                <span className="flex-1 text-sm">{label}</span>
                {active && <ChevronRight className="h-3.5 w-3.5 opacity-40 rtl:rotate-180" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/5">
          <p className="text-xs text-white/15 font-mono">ClinicPro · v1.0</p>
        </div>
      </aside>
    </>
  );
}
