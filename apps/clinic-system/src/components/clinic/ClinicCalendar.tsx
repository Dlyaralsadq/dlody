"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Item = { id: string; status: string; patientName: string; date: string };

const STATUS_COLOR: Record<string, string> = {
  completed: "bg-emerald-400",
  cancelled: "bg-rose-400",
  noShow: "bg-rose-400",
  confirmed: "bg-indigo-400",
  scheduled: "bg-amber-400",
};

export default function ClinicCalendar({
  locale,
  year,
  month,
  items,
}: {
  locale: string;
  year: number;
  month: number;
  items: Item[];
}) {
  const ar = locale === "ar";
  const [selected, setSelected] = useState<number | null>(null);
  const weekdays = ar
    ? ["سبت", "أحد", "إثن", "ثلا", "أرب", "خمي", "جمع"]
    : ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

  const cells = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const days = new Date(year, month, 0).getDate();
    const saturdayOffset = (first.getDay() + 1) % 7;
    const leading = ar ? saturdayOffset : first.getDay();
    return { leading, days };
  }, [year, month, ar]);

  const byDay = useMemo(() => {
    const map = new Map<number, Item[]>();
    for (const item of items) {
      const day = new Date(item.date).getDate();
      map.set(day, [...(map.get(day) ?? []), item]);
    }
    return map;
  }, [items]);

  const label = new Date(year, month - 1, 1).toLocaleDateString(ar ? "ar-IQ" : "en-GB", {
    month: "long",
    year: "numeric",
  });

  function href(delta: number) {
    const next = new Date(year, month - 1 + delta, 1);
    return `/${locale}/clinic/calendar?y=${next.getFullYear()}&m=${next.getMonth() + 1}`;
  }

  const selectedItems = selected ? byDay.get(selected) ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>
          {ar ? "تقويم العيادة" : "Clinic calendar"}
        </h1>
        <div className="flex items-center gap-2">
          <Link href={href(-1)} className="rounded-lg border border-white/10 p-2" style={{ color: "var(--text-2)" }}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="text-sm min-w-28 text-center" style={{ color: "var(--text-1)" }}>{label}</span>
          <Link href={href(1)} className="rounded-lg border border-white/10 p-2" style={{ color: "var(--text-2)" }}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px]" style={{ color: "var(--text-3)" }}>
        {weekdays.map((day) => <div key={day} className="py-1">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: cells.leading }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: cells.days }).map((_, i) => {
          const day = i + 1;
          const list = byDay.get(day) ?? [];
          const active = selected === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelected(day)}
              className={`min-h-16 rounded-xl border p-1.5 text-start ${active ? "border-indigo-400" : "border-white/8"}`}
              style={{ background: "var(--bg-surface)" }}
            >
              <span className="text-xs" style={{ color: "var(--text-1)" }}>{day}</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {list.slice(0, 4).map((item) => (
                  <span key={item.id} className={`h-1.5 w-1.5 rounded-full ${STATUS_COLOR[item.status] ?? "bg-slate-400"}`} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/8 p-4 space-y-2" style={{ background: "var(--bg-surface)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
          {selected ? (ar ? `مواعيد ${selected}` : `Appointments on day ${selected}`) : (ar ? "اختر يوماً" : "Choose a day")}
        </p>
        {selectedItems.length === 0 && selected && (
          <p className="text-xs" style={{ color: "var(--text-3)" }}>{ar ? "لا مواعيد" : "No appointments"}</p>
        )}
        {selectedItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--text-1)" }}>{item.patientName}</span>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>
              {new Date(item.date).toLocaleTimeString(ar ? "ar-IQ" : "en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
