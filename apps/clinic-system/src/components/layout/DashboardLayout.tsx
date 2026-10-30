"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface Props { locale: string; userName?: string; role?: string; doctorSpecialty?: string; recurringCount?: number; userId?: string; messages?: any[]; unreadCount?: number; doctors?: any[]; adminUserId?: string; children: React.ReactNode; }

export default function DashboardLayout({ locale, userName, role="admin", doctorSpecialty, recurringCount, userId, messages, unreadCount, doctors, adminUserId, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-[#060912]">
      <Sidebar locale={locale} isOpen={open} onClose={() => setOpen(false)} role={role} doctorSpecialty={doctorSpecialty} recurringCount={recurringCount} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header locale={locale} userName={userName} onMenuToggle={() => setOpen(true)} role={role} userId={userId} messages={messages} unreadCount={unreadCount} doctors={doctors} adminUserId={adminUserId} />
        <main className="flex-1 overflow-y-auto p-5 mesh-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
