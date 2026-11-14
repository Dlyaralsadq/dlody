"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, MessageSquare, CheckCheck, Bell, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { sendMessage, markAllRead } from "@/app/actions/messages";

interface Message {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  senderName?: string;
  senderRole?: string;
  fromUserId: string;
}

interface MessagingPanelProps {
  userId: string;
  role: string;
  messages: Message[];
  unreadCount: number;
  locale: string;
  // For admin: list of doctors to send to
  doctors?: { id: string; nameAr: string; name: string; user: { id: string } | null }[];
  // For doctor: admin userId to send to
  adminUserId?: string;
}

export default function MessagingPanel({ userId, role, messages, unreadCount, locale, doctors, adminUserId }: MessagingPanelProps) {
  const router = useRouter();
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [toUserId, setToUserId] = useState(adminUserId ?? "");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!content.trim() || !toUserId) return;
    setSending(true);
    await sendMessage(userId, toUserId, content.trim());
    setContent("");
    setComposing(false);
    setSending(false);
    router.refresh();
  };

  const handleOpen = async () => {
    setOpen(true);
    if (unreadCount > 0) {
      await markAllRead(userId);
      router.refresh();
    }
  };

  const doctorOptions = (doctors ?? [])
    .filter(d => d.user?.id)
    .map(d => ({ value: d.user!.id, label: ar ? d.nameAr : d.name }));

  return (
    <>
      {/* Bell icon */}
      <button onClick={handleOpen}
        className="relative flex h-8 w-8 items-center justify-center rounded-xl text-white/30 hover:text-white/70 hover:bg-white/6 transition-colors">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-14">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/8 bg-[#0f1629] shadow-2xl overflow-hidden animate-fade-up">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">
                  {ar ? "الرسائل والإشعارات" : "Messages"}
                </h2>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-xs text-indigo-400 font-bold">
                    {unreadCount} {ar ? "جديدة" : "new"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Compose button - only for admin or doctor */}
                {(role === "admin" && doctorOptions.length > 0) || (role === "doctor" && adminUserId) ? (
                  <Button size="sm" variant="outline" className="gap-1 text-xs h-7"
                    onClick={() => setComposing(!composing)}>
                    <Send className="h-3 w-3" />
                    {ar ? "إرسال" : "Send"}
                  </Button>
                ) : null}
                <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/70">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Compose */}
            {composing && (
              <div className="px-5 py-4 border-b border-white/6 bg-indigo-500/5 space-y-3">
                {role === "admin" && (
                  <Select name="to" label={ar ? "إرسال إلى" : "Send to"} options={doctorOptions}
                    placeholder={ar ? "اختر الطبيب" : "Select doctor"}
                    value={toUserId} onChange={e => setToUserId(e.target.value)} />
                )}
                <Textarea label={ar ? "الرسالة" : "Message"} value={content}
                  onChange={e => setContent(e.target.value)} rows={3}
                  placeholder={ar ? "اكتب رسالتك هنا..." : "Type your message..."} />
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setComposing(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
                  <Button size="sm" loading={sending} onClick={handleSend} disabled={!content.trim() || !toUserId}>
                    <Send className="h-3.5 w-3.5" />{ar ? "إرسال" : "Send"}
                  </Button>
                </div>
              </div>
            )}

            {/* Messages list */}
            <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-white/15" />
                  <p className="text-sm text-white/25">{ar ? "لا توجد رسائل" : "No messages"}</p>
                </div>
              ) : messages.map(msg => (
                <div key={msg.id} className={`px-5 py-3.5 ${!msg.isRead ? "bg-indigo-500/5" : ""}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${msg.fromUserId === "system" ? "bg-amber-400" : "bg-indigo-400"}`} />
                      <span className="text-xs font-semibold text-white/60">
                        {msg.fromUserId === "system"
                          ? (ar ? "النظام" : "System")
                          : msg.senderName ?? (ar ? "مدير النظام" : "Admin")}
                      </span>
                    </div>
                    <span className="text-xs text-white/25 shrink-0">
                      {new Date(msg.createdAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">{msg.content}</p>
                  {!msg.isRead && (
                    <div className="mt-1 flex justify-end">
                      <span className="text-xs text-indigo-400">{ar ? "جديدة" : "New"}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
