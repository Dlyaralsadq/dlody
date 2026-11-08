"use client";

import { usePathname } from "next/navigation";
import PatientAppShell from "./PatientAppShell";
import ScrollSpacer from "@/components/ui/ScrollSpacer";
import { PATIENT_NAV_SCROLL_PADDING } from "@/lib/patientUi";
import { cn } from "@/lib/utils";

const HIDE_NAV_PATHS = ["/login", "/register", "/book/"];

/** Full-height pages that manage bottom inset on an inner scroll area. */
function isFixedViewportPath(pathname: string, base: string): boolean {
  if (pathname === base) return true;
  return new RegExp(`^${base.replace(/\//g, "\\/")}/doctor/[^/]+$`).test(pathname);
}

export default function PatientLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = pathname.match(/^\/(ar|en)\/patient/)?.[1] ?? "ar";
  const base = `/${locale}/patient`;

  const hideNav = HIDE_NAV_PATHS.some((p) => pathname.includes(`${base}${p}`));
  const fixedViewport = isFixedViewportPath(pathname, base);

  return (
    <div
      className={cn(
        !hideNav && "lg:ps-60 desktop-content-inset",
        !hideNav && !fixedViewport && PATIENT_NAV_SCROLL_PADDING
      )}
    >
      {children}
      {!hideNav && !fixedViewport && <ScrollSpacer variant="patientNav" className="mobile-only lg:hidden" />}
      {!hideNav && <PatientAppShell />}
    </div>
  );
}
