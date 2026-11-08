/**
 * Pure, client-safe helpers for formatting "HH:MM" 24-hour time strings
 * as localized 12-hour AM/PM labels. Used across all booking UIs
 * (secretary, doctor, patient online booking) so the displayed time
 * format is consistent everywhere.
 */

export function parseTimeString(time: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return { hour, minute };
}

/** Format a 24h "HH:MM" string as a localized 12-hour label, e.g. "10:00 AM" / "١٠:٠٠ ص". */
export function formatTime12h(time: string, ar: boolean): string {
  const parsed = parseTimeString(time);
  if (!parsed) return time;
  const { hour, minute } = parsed;
  const period = hour >= 12 ? (ar ? "م" : "PM") : (ar ? "ص" : "AM");
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const mm = String(minute).padStart(2, "0");
  return ar ? `${hour12}:${mm} ${period}` : `${hour12}:${mm} ${period}`;
}

/** Format a Date/time-like value's clock time as a localized 12-hour label. */
export function formatDateTime12h(date: Date | string, ar: boolean): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const hour = d.getHours();
  const minute = d.getMinutes();
  return formatTime12h(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`, ar);
}

export function minutesToTimeString(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeStringToMinutes(time: string): number {
  const parsed = parseTimeString(time);
  if (!parsed) return 0;
  return parsed.hour * 60 + parsed.minute;
}
