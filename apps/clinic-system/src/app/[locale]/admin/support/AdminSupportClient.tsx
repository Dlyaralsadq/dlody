"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  HeadphonesIcon, Send, Loader2, MessageCircle,
  CheckCheck, Search, Clock, User, RefreshCw,
  Bell, BellRing, Users, ChevronDown, CheckCircle2, AlertTriangle,
} from "lucide-react";
import {
  sendMessage, getSupportConversation, markAllRead,
  sendSystemNotification,
} from "@/app/actions/messages";

/* ─── Types ─────────────────────────────────────────── */
interface Msg {
  id: string; fromUserId: string; toUserId: string;
  content: string; isRead: boolean; createdAt: Date | string;
}
interface Conversation {
  userId: string; name: string; nameAr?: string | null;
  specialty?: string | null; messages: Msg[];
  unread: number; lastMessage: Msg;
}
interface Doctor {
  id: string; name: string; nameAr: string;
  user: { id: string } | null;
}
interface NotifEntry {
  content: string; createdAt: Date | string; recipients: number;
}
interface Props {
  adminUserId: string;
  conversations: Conversation[];
  doctors: Doctor[];
  notifHistory: NotifEntry[];
  locale: string;
}

/* ─── Component ──────────────────────────────────────── */
export default function AdminSupportClient({
  adminUserId, conversations: initialConvs, doctors, notifHistory: initialHistory, locale,
}: Props) {
  const router = useRouter();
  const ar = locale === "ar";

  /* tabs */
  const [tab, setTab] = useState<"support" | "notify">("support");

  /* ── Support state ── */
  const [convs]       = useState<Conversation[]>(initialConvs);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConvs.find(c => c.unread > 0)?.userId ?? initialConvs[0]?.userId ?? null
  );
  const [thread, setThread]           = useState<Msg[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyText, setReplyText]     = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [search, setSearch]           = useState("");
  const bottomRef  = useRef<HTMLDivElement>(null);
  const replyRef   = useRef<HTMLTextAreaElement>(null);

  /* ── Notify state ── */
  const [notifTarget, setNotifTarget]   = useState<"all" | string>("all");
  const [notifText, setNotifText]       = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifResult, setNotifResult]   = useState<{ ok: boolean; sent?: number } | null>(null);
  const [history, setHistory]           = useState<NotifEntry[]>(initialHistory);
  const [showHistory, setShowHistory]   = useState(false);

  /* ── Support helpers ── */
  const loadThread = async (userId: string) => {
    setLoadingThread(true);
    try {
      const data = await getSupportConversation(userId, adminUserId);
      setThread(data as Msg[]);
      await markAllRead(adminUserId);
      router.refresh();
    } finally { setLoadingThread(false); }
  };

  useEffect(() => { if (selectedId) loadThread(selectedId); }, [selectedId]);
  useEffect(() => { setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80); }, [thread]);
  useEffect(() => {
    if (!selectedId) return;
    const id = setInterval(() => loadThread(selectedId), 20000);
    return () => clearInterval(id);
  }, [selectedId]);

  const handleReply = async () => {
    const t = replyText.trim();
    if (!t || sendingReply || !selectedId) return;
    setSendingReply(true); setReplyText("");
    const temp: Msg = { id: `t${Date.now()}`, fromUserId: adminUserId, toUserId: selectedId, content: t, isRead: false, createdAt: new Date() };
    setThread(p => [...p, temp]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    await sendMessage(adminUserId, selectedId, t);
    await loadThread(selectedId);
    setSendingReply(false);
    replyRef.current?.focus();
  };
  const handleReplyKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); }
  };

  /* ── Notify helpers ── */
  const handleSendNotif = async () => {
    const t = notifText.trim();
    if (!t || sendingNotif) return;
    setSendingNotif(true); setNotifResult(null);
    const target = notifTarget === "all" ? null : notifTarget;
    const res = await sendSystemNotification(target, t);
    setSendingNotif(false);
    if (res.success) {
      setNotifText(""); setNotifResult({ ok: true, sent: res.sent });
      router.refresh();
      // Update history optimistically
      setHistory(p => [{ content: t, createdAt: new Date(), recipients: res.sent }, ...p]);
    } else {
      setNotifResult({ ok: false });
    }
  };
  const handleNotifKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendNotif(); }
  };

  /* ── Shared helpers ── */
  const formatTime = (d: Date | string) => {
    const date = new Date(d);
    const isToday = date.toDateString() === new Date().toDateString();
    if (isToday) return date.toLocaleTimeString(ar ? "ar-IQ" : "en-US", { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString(ar ? "ar-IQ" : "en-US", { month: "short", day: "numeric" });
  };
  const formatDay = (d: Date | string) => {
    const date = new Date(d);
    const isToday = date.toDateString() === new Date().toDateString();
    if (isToday) return ar ? "اليوم" : "Today";
    return date.toLocaleDateString(ar ? "ar-IQ" : "en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  /* group thread by day */
  const grouped: { day: string; messages: Msg[] }[] = [];
  for (const m of thread) {
    const day = new Date(m.createdAt).toDateString();
    const last = grouped[grouped.length - 1];
    if (last && last.day === day) last.messages.push(m);
    else grouped.push({ day, messages: [m] });
  }

  const selectedConv  = convs.find(c => c.userId === selectedId);
  const filtered      = search ? convs.filter(c => (c.nameAr ?? c.name).includes(search) || c.name.toLowerCase().includes(search.toLowerCase())) : convs;
  const totalUnread   = convs.reduce((s, c) => s + c.unread, 0);

  const doctorOptions = doctors
    .filter(d => d.user?.id)
    .map(d => ({ value: d.user!.id, label: ar ? d.nameAr : d.name }));

  /* ══════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4 animate-fade-in">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,.4)" }}>
            <HeadphonesIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{ar ? "مركز الدعم والتواصل" : "Support & Communications"}</h1>
            <p className="text-xs text-white/30 mt-0.5">
              {convs.length} {ar ? "محادثة" : "conversations"}
              {totalUnread > 0 && <span className="ms-2 text-indigo-400 font-semibold">· {totalUnread} {ar ? "غير مقروءة" : "unread"}</span>}
            </p>
          </div>
        </div>
        <button onClick={() => { router.refresh(); if (selectedId) loadThread(selectedId); }}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-white/40 hover:text-white hover:bg-white/5 transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />{ar ? "تحديث" : "Refresh"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit"
        style={{ background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.18)" }}>
        {([
          { id: "support", icon: MessageCircle, label: ar ? "المحادثات" : "Conversations", badge: totalUnread as number | undefined },
          { id: "notify",  icon: BellRing,     label: ar ? "إرسال تنبيه" : "Send Notification", badge: undefined as number | undefined },
        ] as const).map(({ id, icon: Icon, label, badge }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
            style={tab === id ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", boxShadow: "0 4px 14px rgba(99,102,241,.4)" } : { color: "rgba(255,255,255,.45)" }}>
            <Icon className="h-4 w-4" />
            {label}
            {badge && badge > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold px-1">{badge > 9 ? "9+" : badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ══ TAB: SUPPORT ══ */}
      {tab === "support" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 230px)", minHeight: "500px" }}>

          {/* Left: list */}
          <div className="card overflow-hidden flex flex-col"
            style={{ background: "rgba(99,102,241,.06)", borderColor: "rgba(99,102,241,.22)" }}>
            <div className="p-3 border-b" style={{ borderColor: "rgba(99,102,241,.15)" }}>
              <div className="relative">
                <Search className="absolute inset-y-0 start-3 my-auto h-3.5 w-3.5 text-white/30" />
                <input value={search} onChange={e => setSearch(e.target.value)} dir="auto"
                  placeholder={ar ? "بحث عن طبيب..." : "Search doctor..."}
                  className="w-full bg-white/5 border border-white/8 rounded-xl ps-8 pe-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-indigo-500/50 transition-all" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-indigo-500/10">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
                  <MessageCircle className="h-8 w-8 text-white/10" />
                  <p className="text-sm text-white/25">{ar ? "لا توجد محادثات" : "No conversations"}</p>
                </div>
              ) : filtered.map(c => {
                const active = c.userId === selectedId;
                const dName  = ar ? (c.nameAr ?? c.name) : c.name;
                return (
                  <button key={c.userId} onClick={() => setSelectedId(c.userId)}
                    className="w-full text-start px-4 py-3.5 transition-all hover:bg-white/4"
                    style={active ? { background: "rgba(99,102,241,.15)", borderInlineStart: "3px solid rgba(99,102,241,.7)" } : {}}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm text-white"
                        style={{ background: active ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(99,102,241,.2)" }}>
                        {dName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-sm font-semibold truncate ${active ? "text-white" : "text-white/70"}`}>{dName}</p>
                          <span className="text-xs text-white/25 shrink-0">{formatTime(c.lastMessage.createdAt)}</span>
                        </div>
                        {c.specialty && <p className="text-xs text-indigo-400/70 truncate mb-0.5">{c.specialty}</p>}
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs text-white/35 truncate flex-1">
                            {c.lastMessage.fromUserId === adminUserId && <span className="text-white/20">{ar ? "أنت: " : "You: "}</span>}
                            {c.lastMessage.content}
                          </p>
                          {c.unread > 0 && (
                            <span className="shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-bold px-1">{c.unread}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: thread */}
          <div className="lg:col-span-2 card overflow-hidden flex flex-col"
            style={{ background: "linear-gradient(135deg,rgba(99,102,241,.08) 0%,rgba(10,14,40,.95) 100%)", borderColor: "rgba(99,102,241,.25)" }}>
            {!selectedConv ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.2)" }}>
                  <MessageCircle className="h-7 w-7 text-indigo-400/50" />
                </div>
                <p className="text-white/30 text-sm">{ar ? "اختر محادثة لعرضها" : "Select a conversation"}</p>
              </div>
            ) : (
              <>
                {/* Conv header */}
                <div className="flex items-center gap-3 px-5 py-4 shrink-0"
                  style={{ background: "linear-gradient(90deg,rgba(99,102,241,.18),rgba(139,92,246,.1))", borderBottom: "1px solid rgba(99,102,241,.2)" }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 12px rgba(99,102,241,.4)" }}>
                    {(ar ? (selectedConv.nameAr ?? selectedConv.name) : selectedConv.name)[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">{ar ? (selectedConv.nameAr ?? selectedConv.name) : selectedConv.name}</p>
                    {selectedConv.specialty && <p className="text-xs text-indigo-300/70 mt-0.5">{selectedConv.specialty}</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400">{ar ? "نشط" : "Active"}</span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                  {loadingThread && thread.length === 0 ? (
                    <div className="flex items-center justify-center h-full gap-2 text-white/30">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">{ar ? "جاري التحميل..." : "Loading..."}</span>
                    </div>
                  ) : thread.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                      <User className="h-8 w-8 text-white/10" />
                      <p className="text-sm text-white/25">{ar ? "لا توجد رسائل بعد" : "No messages yet"}</p>
                    </div>
                  ) : grouped.map(({ day, messages: dayMsgs }) => (
                    <div key={day} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px" style={{ background: "rgba(99,102,241,.12)" }} />
                        <span className="text-xs text-white/20 px-3 rounded-full"
                          style={{ background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.12)" }}>
                          {formatDay(dayMsgs[0].createdAt)}
                        </span>
                        <div className="flex-1 h-px" style={{ background: "rgba(99,102,241,.12)" }} />
                      </div>
                      {dayMsgs.map(m => {
                        const isAdmin = m.fromUserId === adminUserId;
                        return (
                          <div key={m.id} className={`flex items-end gap-2 ${isAdmin ? "justify-end" : "justify-start"}`}>
                            {!isAdmin && (
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-bold text-xs text-white mb-1"
                                style={{ background: "rgba(99,102,241,.25)" }}>
                                {(ar ? (selectedConv.nameAr ?? selectedConv.name) : selectedConv.name)[0]}
                              </div>
                            )}
                            <div className="max-w-[72%] rounded-2xl px-4 py-2.5"
                              style={isAdmin ? {
                                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                                boxShadow: "0 4px 16px rgba(99,102,241,.3)",
                                borderBottomRightRadius: ar ? "1rem" : "0.25rem",
                                borderBottomLeftRadius: ar ? "0.25rem" : "1rem",
                              } : {
                                background: "rgba(255,255,255,.07)",
                                border: "1px solid rgba(255,255,255,.08)",
                                borderBottomLeftRadius: ar ? "1rem" : "0.25rem",
                                borderBottomRightRadius: ar ? "0.25rem" : "1rem",
                              }}>
                              <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{m.content}</p>
                              <div className={`flex items-center gap-1.5 mt-1 ${isAdmin ? "justify-end" : "justify-start"}`}>
                                <Clock className="h-2.5 w-2.5" style={{ color: isAdmin ? "rgba(255,255,255,.4)" : "rgba(255,255,255,.25)" }} />
                                <span className="text-xs" style={{ color: isAdmin ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.3)" }}>
                                  {formatTime(m.createdAt)}
                                </span>
                                {isAdmin && <CheckCheck className={`h-3 w-3 ${m.isRead ? "text-emerald-400" : "text-white/30"}`} />}
                              </div>
                            </div>
                            {isAdmin && (
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mb-1"
                                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                                <HeadphonesIcon className="h-3.5 w-3.5 text-white" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Reply box */}
                <div className="shrink-0 px-4 py-3"
                  style={{ borderTop: "1px solid rgba(99,102,241,.15)", background: "rgba(0,0,0,.2)" }}>
                  <div className="rounded-xl p-2 flex items-end gap-2"
                    style={{ background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.22)" }}>
                    <textarea ref={replyRef} value={replyText}
                      onChange={e => setReplyText(e.target.value)} onKeyDown={handleReplyKey}
                      rows={2} dir="auto"
                      placeholder={ar ? "اكتب ردك... (Enter للإرسال)" : "Type your reply... (Enter to send)"}
                      className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none resize-none leading-relaxed"
                      style={{ maxHeight: "120px" }} />
                    <button onClick={handleReply} disabled={!replyText.trim() || sendingReply}
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-40 shrink-0"
                      style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 12px rgba(99,102,241,.4)" }}>
                      {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      <span>{ar ? "رد" : "Reply"}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB: NOTIFICATIONS ══ */}
      {tab === "notify" && (
        <div className="space-y-5 max-w-2xl mx-auto">

          {/* Compose card */}
          <div className="card overflow-hidden"
            style={{ background: "linear-gradient(135deg,rgba(99,102,241,.1) 0%,rgba(139,92,246,.06) 100%)", borderColor: "rgba(99,102,241,.3)" }}>

            {/* Card header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b"
              style={{ background: "linear-gradient(90deg,rgba(99,102,241,.2),rgba(139,92,246,.1))", borderColor: "rgba(99,102,241,.22)" }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", boxShadow: "0 4px 12px rgba(245,158,11,.35)" }}>
                <BellRing className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">{ar ? "إرسال تنبيه للأطباء" : "Send Notification to Doctors"}</p>
                <p className="text-xs text-white/35 mt-0.5">{ar ? "تنبيه للقراءة فقط — لا يستطيع الطبيب الرد" : "Read-only alert — doctors cannot reply"}</p>
              </div>
              <div className="ms-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                style={{ background: "rgba(245,158,11,.15)", border: "1px solid rgba(245,158,11,.3)" }}>
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                <span className="text-xs text-amber-400 font-semibold">{ar ? "بث فوري" : "Instant Broadcast"}</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Recipient */}
              <div className="space-y-2">
                <label className="form-label flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-indigo-400" />
                  {ar ? "المستلم" : "Recipient"}
                </label>
                <div className="relative">
                  <select
                    value={notifTarget}
                    onChange={e => setNotifTarget(e.target.value)}
                    className="form-input w-full appearance-none"
                  >
                    <option value="all">{ar ? "🌐 جميع الأطباء" : "🌐 All Doctors"}</option>
                    <optgroup label={ar ? "── طبيب محدد ──" : "── Specific Doctor ──"}>
                      {doctorOptions.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="absolute inset-y-0 end-3 my-auto h-4 w-4 text-white/40 pointer-events-none" />
                </div>
                {notifTarget === "all" && (
                  <p className="text-xs text-amber-400/70 flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3" />
                    {ar ? `سيصل للـ ${doctorOptions.length} طبيب المسجّلين` : `Will be sent to all ${doctorOptions.length} registered doctors`}
                  </p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="form-label">{ar ? "نص التنبيه" : "Notification Message"}</label>
                <textarea
                  value={notifText}
                  onChange={e => setNotifText(e.target.value)}
                  onKeyDown={handleNotifKey}
                  rows={4}
                  dir="auto"
                  placeholder={ar ? "اكتب رسالة التنبيه هنا...\nمثال: سيتم إجراء صيانة للنظام يوم الجمعة من 10م - 12م" : "Type your notification here...\nExample: System maintenance on Friday 10pm - 12am"}
                  className="form-input w-full resize-none leading-relaxed"
                  style={{ minHeight: "100px" }}
                />
                <div className="flex justify-between text-xs text-white/25">
                  <span>{notifText.length} {ar ? "حرف" : "chars"}</span>
                  <span>{ar ? "Enter للإرسال · Shift+Enter لسطر جديد" : "Enter to send · Shift+Enter for new line"}</span>
                </div>
              </div>

              {/* Result */}
              {notifResult && (
                <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${notifResult.ok ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400" : "bg-rose-500/10 border border-rose-500/25 text-rose-400"}`}>
                  {notifResult.ok
                    ? <><CheckCircle2 className="h-4 w-4 shrink-0" />{ar ? `تم الإرسال بنجاح إلى ${notifResult.sent} طبيب` : `Sent successfully to ${notifResult.sent} doctor(s)`}</>
                    : <><AlertTriangle className="h-4 w-4 shrink-0" />{ar ? "حدث خطأ، حاول مجدداً" : "An error occurred, please retry"}</>
                  }
                </div>
              )}

              {/* Send button */}
              <button
                onClick={handleSendNotif}
                disabled={!notifText.trim() || sendingNotif}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-40 hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", boxShadow: "0 6px 20px rgba(245,158,11,.35)" }}
              >
                {sendingNotif ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                {notifTarget === "all"
                  ? (ar ? `إرسال إلى جميع الأطباء (${doctorOptions.length})` : `Send to All Doctors (${doctorOptions.length})`)
                  : (ar ? "إرسال للطبيب المحدد" : "Send to Selected Doctor")}
              </button>
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="card overflow-hidden" style={{ borderColor: "rgba(99,102,241,.2)" }}>
              <button
                onClick={() => setShowHistory(p => !p)}
                className="w-full flex items-center justify-between px-5 py-4"
                style={{ borderBottom: showHistory ? "1px solid rgba(99,102,241,.15)" : "none" }}
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-white/60">
                  <Bell className="h-4 w-4 text-amber-400" />
                  {ar ? `التنبيهات المرسلة (${history.length})` : `Sent Notifications (${history.length})`}
                </div>
                <ChevronDown className={`h-4 w-4 text-white/30 transition-transform ${showHistory ? "rotate-180" : ""}`} />
              </button>

              {showHistory && (
                <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                  {history.map((h, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                        style={{ background: "rgba(245,158,11,.12)", border: "1px solid rgba(245,158,11,.2)" }}>
                        <Bell className="h-3.5 w-3.5 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{h.content}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-white/25">{formatTime(h.createdAt)}</span>
                          <span className="text-xs text-indigo-400/70 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {h.recipients} {ar ? "مستلم" : "recipients"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
