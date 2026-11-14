"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { sendTomorrowReminders, type TomorrowReminder } from "@/app/actions/clinicInsights";

export default function ReminderPanel({
  doctorId,
  locale,
  items,
}: {
  doctorId: string;
  locale: string;
  items: TomorrowReminder[];
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const pending = items.filter((item) => !item.sent);

  async function send() {
    setSending(true);
    const response = await sendTomorrowReminders(doctorId, locale);
    setSending(false);
    if (!response.success) return;
    setResult(
      response.pending > 0
        ? (ar
          ? `أُرسل ${response.sent}. بقي ${response.pending} لأن واتساب أو البريد غير مربوط، ويمكن نسخ النص أدناه.`
          : `Sent ${response.sent}. ${response.pending} stayed here because WhatsApp or email is not connected. Copy the text below.`)
        : (ar ? `أُرسلت ${response.sent} تذكيرات` : `Sent ${response.sent} reminders`)
    );
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-white/8 p-4 space-y-3" style={{ background: "var(--bg-surface)" }}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-1)" }}>
          <Bell className="h-4 w-4 text-amber-400" />
          {ar ? "تذكير مواعيد الغد" : "Tomorrow's reminders"}
        </h2>
        <button
          type="button"
          disabled={sending || pending.length === 0}
          onClick={() => void send()}
          className="rounded-xl bg-amber-500/90 px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-40"
        >
          {sending ? "..." : ar ? "إرسال التذكيرات" : "Send reminders"}
        </button>
      </div>
      {result && <p className="text-xs" style={{ color: "var(--text-2)" }}>{result}</p>}
      {items.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--text-3)" }}>{ar ? "لا مواعيد غداً" : "No appointments tomorrow"}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="text-xs" style={{ color: "var(--text-2)" }}>
              <span className="font-semibold" style={{ color: "var(--text-1)" }}>{item.patientName}</span>
              {" · "}
              {item.sent ? (ar ? "أُرسل" : "Sent") : item.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
