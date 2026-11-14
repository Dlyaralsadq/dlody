"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateId } from "@/lib/utils";

export async function getAppointments(filters?: {
  search?: string;
  status?: string;
  doctorId?: string;
  date?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.doctorId) where.doctorId = filters.doctorId;
  if (filters?.date) {
    const start = new Date(filters.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.date);
    end.setHours(23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }

  if (filters?.search) {
    where.OR = [
      { patient: { name: { contains: filters.search } } },
      { doctor: { name: { contains: filters.search } } },
      { appointmentNumber: { contains: filters.search } },
    ];
  }

  return prisma.appointment.findMany({
    where,
    include: {
      patient: true,
      doctor: { include: { specialty: true } },
    },
    orderBy: { date: "desc" },
  });
}

export async function getAppointment(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: { include: { specialty: true } },
    },
  });
}

export async function getTodayAppointments() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return prisma.appointment.findMany({
    where: { date: { gte: start, lte: end } },
    include: {
      patient: true,
      doctor: { include: { specialty: true } },
    },
    orderBy: { date: "asc" },
  });
}

export async function createAppointment(data: {
  patientId: string;
  doctorId: string;
  date: string;
  duration?: number;
  type?: string;
  status?: string;
  reason?: string;
  notes?: string;
}) {
  const appointmentNumber = generateId("APT");

  await prisma.appointment.create({
    data: {
      ...data,
      appointmentNumber,
      date: new Date(data.date),
      duration: data.duration ?? 30,
      type: data.type ?? "consultation",
      status: data.status ?? "scheduled",
    },
  });

  revalidatePath("/[locale]/appointments", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { success: true };
}

export async function updateAppointment(id: string, data: Partial<{
  patientId: string;
  doctorId: string;
  date: string;
  duration: number;
  type: string;
  status: string;
  reason: string;
  notes: string;
}>) {
  await prisma.appointment.update({
    where: { id },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    },
  });

  revalidatePath("/[locale]/appointments", "page");
  return { success: true };
}

export async function deleteAppointment(id: string) {
  await prisma.appointment.delete({ where: { id } });
  revalidatePath("/[locale]/appointments", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { success: true };
}

export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [totalPatients, totalDoctors, todayAppointments, pendingAppointments, recentPatients, upcomingAppointments] = await Promise.all([
    prisma.patient.count(),
    prisma.doctor.count({ where: { isActive: true } }),
    prisma.appointment.count({ where: { date: { gte: today, lte: todayEnd } } }),
    prisma.appointment.count({ where: { status: "scheduled" } }),
    prisma.patient.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.appointment.findMany({
      where: { date: { gte: new Date() }, status: { in: ["scheduled", "confirmed"] } },
      include: { patient: true, doctor: { include: { specialty: true } } },
      orderBy: { date: "asc" },
      take: 8,
    }),
  ]);

  return { totalPatients, totalDoctors, todayAppointments, pendingAppointments, recentPatients, upcomingAppointments };
}
