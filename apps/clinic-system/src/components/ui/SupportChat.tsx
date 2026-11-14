"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { HeadphonesIcon, X, Send, Loader2, MessageCircle, CheckCheck } from "lucide-react";
import { sendMessage, getSupportConversation, markAllRead } from "@/app/actions/messages";

interface Msg {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  isRead: boolean;
  createdAt: Date | string;
}

interface SupportChatProps {
  userId: string;
  adminUserId: string;
  locale: string;
  unreadCount?: number;
}

export default function SupportChat({ userId, adminUserId, locale, unreadCount = 0 }: SupportChatProps) {
  const router = useRouter();
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadConversation = async () => {
    setLoading(true);
    try {
      const data = await getSupportConversation(userId, adminUserId);
      setMsgs(data as Msg[]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    setOpen(true);
    await loadConversation();
    if (unreadCount > 0) {
      await markAllRead(userId);
      router.refresh();
    }
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [open, msgs]);

  // Poll every 15 seconds when open
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(loadConversation, 15000);
    return () => clearInterval(interval);
  }, [open]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    // Optimistic
    const temp: Msg = {
      id: `temp-${Date.now()}`,
      fromUserId: userId,
      toUserId: adminUserId,
      content: trimmed,
      isRead: false,
      createdAt: new Date(),
    };
    setMsgs(prev => [...prev, temp]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    await sendMessage(userId, adminUserId, trimmed);
    await loadConversation();
    setSending(false);
    textareaRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (d: Date | string) => {
    const date = new Date(d);
    return date.toLocaleTimeString(ar ? "ar-IQ" : "en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDay = (d: Date | string) => {
    const date = new Date(d);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) return ar ? "اليوم" : "Today";
    return date.toLocaleDateString(ar ? "ar-IQ" : "en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  // Group messages by day
  const grouped: { day: string; messages: Msg[] }[] = [];
  for (const m of msgs) {
    const day = new Date(m.createdAt).toDateString();
    const last = grouped[grouped.length - 1];
    if (last && last.day === day) { last.messages.push(m); }
    else grouped.push({ day, messages: [m] });
  }

  return (
    <>
      {/* Floating support button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 z-40 flex items-center gap-2 rounded-2xl px-4 py-3 text-white text-sm font-semibold shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{
          [ar ? "left" : "right"]: "1.5rem",
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          boxShadow: "0 8px 32px rgba(99,102,241,.55)",
        }}
        title={ar ? "مراسلة الدعم" : "Contact Support"}
      >
        <HeadphonesIcon className="h-4 w-4" />
        <span>{ar ? "الدعم الفني" : "Support"}</span>
        {unreadCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 pointer-events-none">
          {/* Backdrop */}
          <div
            className="absolute inset-0 pointer-events-auto"
            onClick={() => setOpen(false)}
          />

          <div
            className="relative w-full max-w-sm rounded-2xl overflow-hidden flex flex-col pointer-events-auto animate-fade-up"
            style={{
              height: "min(520px, 80vh)",
              border: "1px solid rgba(99,102,241,.3)",
              background: "linear-gradient(180deg,#0f1629 0%,#0a0f24 100%)",
              boxShadow: "0 24px 64px rgba(0,0,0,.6), 0 0 0 1px rgba(99,102,241,.15)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3.5 shrink-0"
              style={{ background: "linear-gradient(135deg,rgba(99,102,241,.25),rgba(139,92,246,.15))", borderBottom: "1px solid rgba(99,102,241,.2)" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 12px rgba(99,102,241,.4)" }}>
                  <HeadphonesIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{ar ? "الدعم الفني" : "Technical Support"}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-xs text-emerald-400">{ar ? "متاح" : "Online"}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {loading && msgs.length === 0 ? (
                <div className="flex items-center justify-center h-full gap-2 text-white/30">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">{ar ? "جاري التحميل..." : "Loading..."}</span>
                </div>
              ) : msgs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.2)" }}>
                    <MessageCircle className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/60">{ar ? "تواصل مع فريق الدعم" : "Chat with Support"}</p>
                    <p className="text-xs text-white/25 mt-1">{ar ? "سيرد عليك فريقنا في أقرب وقت" : "Our team will reply as soon as possible"}</p>
                  </div>
                </div>
              ) : (
                grouped.map(({ day, messages: dayMsgs }) => (
                  <div key={day} className="space-y-2">
                    {/* Day divider */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px" style={{ background: "rgba(99,102,241,.15)" }} />
                      <span className="text-xs text-white/25 px-2">{formatDay(dayMsgs[0].createdAt)}</span>
                      <div className="flex-1 h-px" style={{ background: "rgba(99,102,241,.15)" }} />
                    </div>

                    {dayMsgs.map(m => {
                      const isMine = m.fromUserId === userId;
                      return (
                        <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className="max-w-[80%] rounded-2xl px-3.5 py-2.5 space-y-1"
                            style={isMine ? {
                              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                              boxShadow: "0 4px 12px rgba(99,102,241,.3)",
                              borderBottomRightRadius: ar ? "0.5rem" : "0.25rem",
                              borderBottomLeftRadius: ar ? "0.25rem" : "0.5rem",
                            } : {
                              background: "rgba(255,255,255,.07)",
                              border: "1px solid rgba(255,255,255,.08)",
                              borderBottomLeftRadius: ar ? "0.5rem" : "0.25rem",
                              borderBottomRightRadius: ar ? "0.25rem" : "0.5rem",
                            }}
                          >
                            {!isMine && (
                              <p className="text-xs font-semibold text-indigo-400 mb-0.5">{ar ? "فريق الدعم" : "Support Team"}</p>
                            )}
                            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{m.content}</p>
                            <div className={`flex items-center gap-1 ${isMine ? "justify-end" : "justify-start"}`}>
                              <span className="text-xs" style={{ color: isMine ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.3)" }}>
                                {formatTime(m.createdAt)}
                              </span>
                              {isMine && (
                                <CheckCheck className={`h-3 w-3 ${m.isRead ? "text-emerald-400" : "text-white/40"}`} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div
              className="shrink-0 px-3 py-3"
              style={{ borderTop: "1px solid rgba(99,102,241,.15)", background: "rgba(0,0,0,.2)" }}
            >
              <div
                className="flex items-end gap-2 rounded-xl p-2"
                style={{ background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.2)" }}
              >
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                  dir="auto"
                  placeholder={ar ? "اكتب رسالتك... (Enter للإرسال)" : "Type your message... (Enter to send)"}
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none resize-none leading-relaxed"
                  style={{ maxHeight: "80px" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 2px 8px rgba(99,102,241,.4)" }}
                >
                  {sending ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" /> : <Send className="h-3.5 w-3.5 text-white" />}
                </button>
              </div>
              <p className="text-center text-xs text-white/15 mt-1.5">
                {ar ? "Enter للإرسال · Shift+Enter لسطر جديد" : "Enter to send · Shift+Enter for new line"}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
