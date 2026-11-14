"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ScrollSpacer from "@/components/ui/ScrollSpacer";
import { SCROLL_CONTAINER, SCROLL_CONTAINER_PADDING } from "@/lib/scrollUi";
const SupportChat = dynamic(() => import("@/components/ui/SupportChat"), { ssr: false });

interface Props { locale: string; userName?: string; role?: string; doctorSpecialty?: string; doctorLogoUrl?: string | null; recurringPatientsEnabled?: boolean; recurringCount?: number; userId?: string; messages?: any[]; unreadCount?: number; doctors?: any[]; adminUserId?: string; supportUnread?: number; children: React.ReactNode; }

export default function DashboardLayout({ locale, userName, role="admin", doctorSpecialty, doctorLogoUrl, recurringPatientsEnabled, recurringCount, userId, messages, unreadCount, doctors, adminUserId, supportUnread, children }: Props) {
  const [open, setOpen] = useState(false);
  // Show support chat for doctors/secretaries who have a userId and adminUserId
  const showSupport = role === "doctor" && !!userId && !!adminUserId;

  return (
    <div className="flex h-screen overflow-hidden bg-app-root">
      <Sidebar locale={locale} isOpen={open} onClose={() => setOpen(false)} role={role} doctorSpecialty={doctorSpecialty} doctorLogoUrl={doctorLogoUrl} recurringPatientsEnabled={recurringPatientsEnabled} recurringCount={recurringCount} supportUnread={supportUnread} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header locale={locale} userName={userName} onMenuToggle={() => setOpen(true)} role={role} userId={userId} doctorLogoUrl={doctorLogoUrl} messages={messages} unreadCount={unreadCount} doctors={doctors} adminUserId={adminUserId} />
        <main className={`flex-1 p-5 mesh-bg ${SCROLL_CONTAINER} ${SCROLL_CONTAINER_PADDING}`}>
          {children}
          <ScrollSpacer variant="dashboard" />
        </main>
      </div>
      {showSupport && (
        <SupportChat
          userId={userId!}
          adminUserId={adminUserId!}
          locale={locale}
          unreadCount={unreadCount}
        />
      )}
    </div>
  );
}
