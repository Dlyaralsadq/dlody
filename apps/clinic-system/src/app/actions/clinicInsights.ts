"use server";

import { prisma } from "@/lib/prisma";
import { assertClinicAccess } from "@/lib/clinicAccess";
import { deliverPatientReminder } from "@/lib/notify";

function monthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

function dayRange(offsetDays: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offsetDays);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function getClinicReport(doctorId: string) {
  if (!(await assertClinicAccess(doctorId))) return null;
  const { start, end } = monthRange();
  const [doctor, appointments, newPatients] = await Promise.all([
    prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { consultationFee: true },
    }),
    prisma.appointment.findMany({
      where: { doctorId, deletedAt: null, date: { gte: start, lt: end } },
      select: { status: true, isPaid: true, feeAmount: true, diagnosis: true },
    }),
    prisma.patient.count({ where: { doctorId, createdAt: { gte: start, lt: end } } }),
  ]);

  const fee = doctor?.consultationFee ?? 0;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled" || a.status === "noShow").length;
  const paid = appointments.filter((a) => a.isPaid);
  const revenue = paid.reduce((sum, a) => sum + (a.feeAmount ?? fee), 0);

  const diagnosisCounts = new Map<string, number>();
  for (const apt of appointments) {
    const title = apt.diagnosis?.trim();
    if (!title) continue;
    diagnosisCounts.set(title, (diagnosisCounts.get(title) ?? 0) + 1);
  }
  const topDiagnoses = [...diagnosisCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title, count]) => ({ title, count }));

  return {
    visits: appointments.length,
    completed,
    cancelled,
    paidCount: paid.length,
    revenue,
    newPatients,
    topDiagnoses,
  };
}

export type TomorrowReminder = {
  id: string;
  patientName: string;
  phone: string;
  date: string;
  sent: boolean;
  text: string;
};

export async function getTomorrowReminders(doctorId: string, locale: string): Promise<TomorrowReminder[]> {
  if (!(await assertClinicAccess(doctorId))) return [];
  const { start, end } = dayRange(1);
  const [doctor, rows] = await Promise.all([
    prisma.doctor.findUnique({ where: { id: doctorId }, select: { nameAr: true, name: true } }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        deletedAt: null,
        date: { gte: start, lt: end },
        status: { in: ["scheduled", "confirmed"] },
      },
      include: { patient: { select: { name: true, phone: true, email: true } } },
      orderBy: { date: "asc" },
    }),
  ]);

  const ar = locale === "ar";
  const clinic = ar ? (doctor?.nameAr || doctor?.name || "") : (doctor?.name || doctor?.nameAr || "");
  return rows.map((row) => {
    const time = row.date.toLocaleTimeString(ar ? "ar-IQ" : "en-GB", { hour: "2-digit", minute: "2-digit" });
    const text = ar
      ? `تذكير من عيادة ${clinic}: موعدك غداً الساعة ${time}.`
      : `Reminder from ${clinic}: your appointment is tomorrow at ${time}.`;
    return {
      id: row.id,
      patientName: row.patient.name,
      phone: row.patient.phone,
      date: row.date.toISOString(),
      sent: !!row.reminderSentAt,
      text,
    };
  });
}

export async function sendTomorrowReminders(doctorId: string, locale: string) {
  if (!(await assertClinicAccess(doctorId))) return { success: false as const, sent: 0, pending: 0 };
  const { start, end } = dayRange(1);
  const [doctor, rows] = await Promise.all([
    prisma.doctor.findUnique({ where: { id: doctorId }, select: { nameAr: true, name: true } }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        deletedAt: null,
        reminderSentAt: null,
        date: { gte: start, lt: end },
        status: { in: ["scheduled", "confirmed"] },
      },
      include: { patient: { select: { name: true, phone: true, email: true } } },
    }),
  ]);

  const ar = locale === "ar";
  const clinic = ar ? (doctor?.nameAr || doctor?.name || "") : (doctor?.name || doctor?.nameAr || "");
  let sent = 0;
  for (const row of rows) {
    const time = row.date.toLocaleTimeString(ar ? "ar-IQ" : "en-GB", { hour: "2-digit", minute: "2-digit" });
    const text = ar
      ? `تذكير من عيادة ${clinic}: موعدك غداً الساعة ${time}.`
      : `Reminder from ${clinic}: your appointment is tomorrow at ${time}.`;
    const delivered = await deliverPatientReminder({
      phone: row.patient.phone,
      email: row.patient.email,
      text,
      subject: ar ? "تذكير بموعد العيادة" : "Clinic appointment reminder",
    });
    if (delivered) {
      await prisma.appointment.update({
        where: { id: row.id },
        data: { reminderSentAt: new Date() },
      });
      sent += 1;
    }
  }
  return { success: true as const, sent, pending: rows.length - sent };
}

export async function getMonthAppointments(doctorId: string, year: number, month: number) {
  if (!(await assertClinicAccess(doctorId))) return [];
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const rows = await prisma.appointment.findMany({
    where: { doctorId, deletedAt: null, date: { gte: start, lt: end } },
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      status: true,
      patient: { select: { name: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    patientName: row.patient.name,
    date: row.date.toISOString(),
  }));
}
