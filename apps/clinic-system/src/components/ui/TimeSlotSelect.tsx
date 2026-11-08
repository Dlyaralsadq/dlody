"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getAppointmentDaySlots, type SlotInfo } from "@/app/actions/appointmentAvailability";
import { formatTime12h } from "@/lib/timeFormat";

interface TimeSlotSelectProps {
  doctorId: string;
  date: string; // "YYYY-MM-DD"
  locale: string;
  value: string; // "HH:MM"
  onChange: (time: string) => void;
  name?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  /** Exclude this appointment's own slot from the conflict check (edit mode). */
  excludeAppointmentId?: string;
  className?: string;
}

/**
 * Reusable slot picker used by secretary booking, doctor appointment editing,
 * and patient online booking. Fetches real availability for the selected
 * doctor + date (accounting for the doctor's configured appointment duration)
 * and renders times as localized 12-hour AM/PM labels, disabling already
 * booked slots so double-booking is impossible from the UI.
 */
export default function TimeSlotSelect({
  doctorId,
  date,
  locale,
  value,
  onChange,
  name,
  label,
  required,
  disabled,
  excludeAppointmentId,
  className,
}: TimeSlotSelectProps) {
  const ar = locale === "ar";
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!doctorId || !date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getAppointmentDaySlots(doctorId, date, excludeAppointmentId ? { excludeAppointmentId } : undefined)
      .then((res) => {
        if (cancelled) return;
        setSlots(res.slots);
        setFetchedFor(date);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, date, excludeAppointmentId]);

  const inputCls = className ?? "form-input w-full";

  // Always include the currently selected value as an option (e.g. an already
  // booked slot being edited, or a slot outside the generated grid).
  const options = value && !slots.some((s) => s.time === value)
    ? [{ time: value, available: true }, ...slots]
    : slots;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-rose-400 ms-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          name={name}
          required={required}
          disabled={disabled || (loading && slots.length === 0)}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
          dir="ltr"
        >
          <option value="">{ar ? "اختر الوقت" : "Choose time"}</option>
          {options.map((s) => (
            <option key={s.time} value={s.time} disabled={!s.available}>
              {formatTime12h(s.time, ar)}
              {!s.available ? ` — ${ar ? "محجوز" : "Booked"}` : ""}
            </option>
          ))}
        </select>
        {loading && fetchedFor !== date && (
          <Loader2 size={13} className="absolute end-3 top-1/2 -translate-y-1/2 animate-spin text-white/30 pointer-events-none" />
        )}
      </div>
    </div>
  );
}
