"use server";

import { prisma } from "@/lib/prisma";
import { minutesToTimeString, timeStringToMinutes } from "@/lib/timeFormat";

export interface SlotInfo {
  time: string;
  available: boolean;
}

export interface DaySlotsResult {
  durationMinutes: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  slots: SlotInfo[];
}

const DEFAULT_START = "08:00";
const DEFAULT_END = "20:00";
const DEFAULT_DURATION = 30;

/**
 * Builds the full list of bookable time slots for a doctor on a given date,
 * marking each slot as available/unavailable based on existing appointments
 * and the doctor's configured per-patient appointment duration.
 */
export async function getAppointmentDaySlots(
  doctorId: string,
  dateStr: string,
  opts?: { excludeAppointmentId?: string }
): Promise<DaySlotsResult> {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { workingHoursStart: true, workingHoursEnd: true, appointmentDuration: true },
  });

  const durationMinutes =
    doctor?.appointmentDuration && doctor.appointmentDuration > 0
      ? doctor.appointmentDuration
      : DEFAULT_DURATION;
  const startStr = doctor?.workingHoursStart || DEFAULT_START;
  const endStr = doctor?.workingHoursEnd || DEFAULT_END;

  const startMin = timeStringToMinutes(startStr);
  let endMin = timeStringToMinutes(endStr);
  if (endMin <= startMin) endMin = startMin + 12 * 60;

  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) {
    return { durationMinutes, workingHoursStart: startStr, workingHoursEnd: endStr, slots: [] };
  }

  const bookedIntervals = await getBookedIntervals(doctorId, dateStr, opts?.excludeAppointmentId, durationMinutes);

  const slots: SlotInfo[] = [];
  for (let t = startMin; t + durationMinutes <= endMin; t += durationMinutes) {
    const slotEnd = t + durationMinutes;
    const overlap = bookedIntervals.some((b) => t < b.end && slotEnd > b.start);
    slots.push({ time: minutesToTimeString(t), available: !overlap });
  }

  return { durationMinutes, workingHoursStart: startStr, workingHoursEnd: endStr, slots };
}

async function getBookedIntervals(
  doctorId: string,
  dateStr: string,
  excludeAppointmentId: string | undefined,
  fallbackDuration: number
): Promise<{ start: number; end: number }[]> {
  const [year, month, day] = dateStr.split("-").map(Number);
  const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
  const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      date: { gte: dayStart, lte: dayEnd },
      status: { notIn: ["cancelled", "deleted"] },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
    select: { date: true, duration: true },
  });

  return appointments.map((a) => {
    const start = a.date.getHours() * 60 + a.date.getMinutes();
    const dur = a.duration && a.duration > 0 ? a.duration : fallbackDuration;
    return { start, end: start + dur };
  });
}

/**
 * Server-side guard used right before creating/editing an appointment, to
 * prevent double-booking even if the client's slot list was stale.
 */
export async function isAppointmentSlotAvailable(
  doctorId: string,
  dateStr: string,
  time: string,
  opts?: { excludeAppointmentId?: string; durationMinutes?: number }
): Promise<boolean> {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { appointmentDuration: true },
  });
  const durationMinutes =
    opts?.durationMinutes ??
    (doctor?.appointmentDuration && doctor.appointmentDuration > 0
      ? doctor.appointmentDuration
      : DEFAULT_DURATION);

  const [hour, minute] = time.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return false;

  const slotStart = hour * 60 + minute;
  const slotEnd = slotStart + durationMinutes;

  const bookedIntervals = await getBookedIntervals(doctorId, dateStr, opts?.excludeAppointmentId, durationMinutes);
  return !bookedIntervals.some((b) => slotStart < b.end && slotEnd > b.start);
}
