"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateId } from "@/lib/utils";

// ─── Queue / Arrival ───────────────────────────────────────────
export async function getTodayQueue(doctorId: string) {
  const now = new Date();
  const start = new Date(now); start.setHours(-2, 0, 0, 0);
  const end = new Date(now); end.setHours(25, 59, 59, 999);

  return prisma.appointment.findMany({
    where: { doctorId, date: { gte: start, lte: end } },
    include: { patient: true },
    orderBy: [{ queueNumber: "asc" }, { date: "asc" }],
  });
}

export async function checkInPatient(appointmentId: string, doctorId: string) {
  // Get max queue number for today
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);

  const maxQueue = await prisma.appointment.aggregate({
    where: { doctorId, date: { gte: start, lte: end }, queueNumber: { not: null } },
    _max: { queueNumber: true },
  });

  const nextQueue = (maxQueue._max.queueNumber ?? 0) + 1;

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { arrivalStatus: "arrived", queueNumber: nextQueue, status: "confirmed" },
  });

  revalidatePath("/[locale]/secretary", "page");
  revalidatePath("/[locale]/waiting", "page");
  revalidatePath("/[locale]/doctor", "page");
  return { success: true, queueNumber: nextQueue };
}

export async function callNextPatient(doctorId: string) {
  // Mark current "with_doctor" or "called" as done
  await prisma.appointment.updateMany({
    where: { doctorId, arrivalStatus: { in: ["with_doctor", "called"] } },
    data: { arrivalStatus: "done", status: "completed" },
  });

  // Prioritize returnedFromTest patients, then by queue number
  const next = await prisma.appointment.findFirst({
    where: { doctorId, arrivalStatus: "arrived" },
    orderBy: [{ returnedFromTest: "desc" }, { queueNumber: "asc" }],
    include: { patient: true },
  });

  if (next) {
    await prisma.appointment.update({
      where: { id: next.id },
      data: { arrivalStatus: "called" },
    });
  }

  revalidatePath("/[locale]/doctor", "page");
  revalidatePath("/[locale]/secretary", "page");
  revalidatePath("/[locale]/waiting", "page");
  return { success: true, next };
}

export async function confirmPatientEntry(appointmentId: string, doctorId: string) {
  const apt = await prisma.appointment.findFirst({
    where: { id: appointmentId, doctorId, arrivalStatus: "called" },
  });
  if (!apt) return { success: false };

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { arrivalStatus: "with_doctor" },
  });

  revalidatePath("/[locale]/doctor", "page");
  revalidatePath("/[locale]/secretary", "page");
  revalidatePath("/[locale]/waiting", "page");
  return { success: true };
}

export async function updateDiagnosis(appointmentId: string, doctorId: string, data: {
  diagnosis?: string; prescription?: string; notes?: string;
}) {
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { ...data, arrivalStatus: "done", status: "completed" },
  });

  revalidatePath("/[locale]/doctor", "page");
  return { success: true };
}

// ─── Quick Booking (Secretary) ─────────────────────────────────
export async function quickBookAppointment(doctorId: string, data: {
  patientName: string;
  patientPhone: string;
  patientGender: string;
  patientNameAr?: string;
  date: string;
  time: string;
  type?: string;
  reason?: string;
  notes?: string;
  existingPatientId?: string;
}) {
  let patientId = data.existingPatientId;

  if (!patientId) {
    // Auto-create patient
    const patientNumber = generateId("P");
    const patient = await prisma.patient.create({
      data: {
        name: data.patientName,
        nameAr: data.patientNameAr,
        phone: data.patientPhone,
        gender: data.patientGender,
        patientNumber,
        doctorId,
      },
    });
    patientId = patient.id;
  }

  const appointmentNumber = generateId("APT");
  // Parse as local time to avoid UTC offset shifting the date
  const [year, month, day] = data.date.split("-").map(Number);
  const [hour, minute] = data.time.split(":").map(Number);
  const dateTime = new Date(year, month - 1, day, hour, minute, 0);

  await prisma.appointment.create({
    data: {
      appointmentNumber,
      patientId,
      doctorId,
      date: dateTime,
      duration: 30,
      type: data.type ?? "consultation",
      status: "scheduled",
      reason: data.reason,
      notes: data.notes,
    },
  });

  revalidatePath("/[locale]/secretary", "page");
  revalidatePath("/[locale]/doctor", "page");
  return { success: true };
}

export async function getSecretaryDoctorId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.linkedDoctorId ?? null;
}

export async function getDoctorForDisplay(doctorId: string) {
  return prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { specialty: true },
  });
}

export async function getWaitingRoomData(doctorId: string) {
  // No date filter - show all active appointments to avoid timezone issues
  const appointments = await prisma.appointment.findMany({
    where: { doctorId, status: { not: "completed" } },
    include: { patient: true },
    orderBy: [{ queueNumber: "asc" }, { date: "asc" }],
  });

  const waiting    = appointments.filter(a => a.arrivalStatus === "arrived");
  const called     = appointments.find(a => a.arrivalStatus === "called");
  const withDoctor = appointments.find(a => a.arrivalStatus === "with_doctor");
  const onHold     = appointments.filter(a => a.arrivalStatus === "on_hold");
  const pending    = appointments.filter(a => a.arrivalStatus === "pending");

  return { waiting, called, withDoctor, onHold, done: [], pending, total: appointments.length };
}

export async function markPayment(appointmentId: string, doctorId: string, isPaid: boolean) {
  const apt = await prisma.appointment.findFirst({ where: { id: appointmentId, doctorId } });
  if (!apt) return { success: false };
  await prisma.appointment.update({ where: { id: appointmentId }, data: { isPaid } });
  revalidatePath("/[locale]/secretary", "page");
  return { success: true };
}

export async function completeAppointment(appointmentId: string, doctorId: string, data?: {
  diagnosis?: string; prescription?: string; notes?: string;
}) {
  const apt = await prisma.appointment.findFirst({ where: { id: appointmentId, doctorId } });
  if (!apt) return { success: false };
  
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      ...data,
      arrivalStatus: "done",
      status: "completed",
      completedAt: new Date(),
    },
  });

  revalidatePath("/[locale]/doctor", "page");
  revalidatePath("/[locale]/secretary", "page");
  revalidatePath("/[locale]/waiting", "page");
  return { success: true };
}

export async function getAllAppointmentsForArchive(doctorId: string) {
  const [completed, pending] = await Promise.all([
    prisma.appointment.findMany({
      where: { doctorId, status: "completed" },
      include: { patient: true },
      orderBy: { completedAt: "desc" },
    }),
    prisma.appointment.findMany({
      where: { doctorId, status: { not: "completed" } },
      include: { patient: true },
      orderBy: { date: "asc" },
    }),
  ]);
  return { completed, pending };
}

export async function getCompletedAppointments(doctorId: string) {
  return prisma.appointment.findMany({
    where: { doctorId, status: "completed" },
    include: { patient: true },
    orderBy: { completedAt: "desc" },
    take: 50,
  });
}

export async function getTodaySyncedQueue(doctorId: string) {
  return prisma.appointment.findMany({
    where: { doctorId, status: { notIn: ["completed", "deleted"] } },
    include: { patient: true },
    orderBy: [{ queueNumber: "asc" }, { date: "asc" }],
  });
}

export async function getAllUpcomingAppointments(doctorId: string) {
  const start = new Date(); start.setHours(0, 0, 0, 0);

  return prisma.appointment.findMany({
    where: { doctorId, date: { gte: start }, status: { notIn: ["completed", "deleted"] } },
    include: { patient: true },
    orderBy: { date: "asc" },
  });
}

export async function getSecretaryDeletedAppointments(doctorId: string) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  return prisma.appointment.findMany({
    where: {
      doctorId,
      status: "deleted",
      deletedAt: { gte: start },
    },
    include: { patient: true },
    orderBy: { deletedAt: "desc" },
  });
}

// ── Hold for Test ──────────────────────────────────────────────
export async function holdPatientForTest(appointmentId: string, doctorId: string, holdReason: string) {
  const apt = await prisma.appointment.findFirst({ where: { id: appointmentId, doctorId, arrivalStatus: "with_doctor" } });
  if (!apt) return { success: false };

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { arrivalStatus: "on_hold", holdReason },
  });

  revalidatePath("/[locale]/doctor", "page");
  revalidatePath("/[locale]/secretary", "page");
  revalidatePath("/[locale]/waiting", "page");
  return { success: true };
}

export async function patientReturnedFromTest(appointmentId: string, doctorId: string) {
  const apt = await prisma.appointment.findFirst({ where: { id: appointmentId, doctorId, arrivalStatus: "on_hold" } });
  if (!apt) return { success: false };

  // Find minimum queue number of current waiting patients to place before them
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);

  const firstWaiting = await prisma.appointment.findFirst({
    where: { doctorId, date: { gte: start, lte: end }, arrivalStatus: "arrived" },
    orderBy: { queueNumber: "asc" },
  });

  // Priority: place before the first waiting patient (use a lower queue number)
  // If nobody waiting, get next number after current max
  let priorityQueue: number;
  if (firstWaiting?.queueNumber && firstWaiting.queueNumber > 1) {
    // Shift all current waiting patients up by 1, then take the first waiting slot
    await prisma.appointment.updateMany({
      where: { doctorId, date: { gte: start, lte: end }, arrivalStatus: "arrived" },
      data: { queueNumber: { increment: 1 } },
    });
    priorityQueue = firstWaiting.queueNumber; // now the slot is free
  } else {
    // No one waiting or queue is at 1; find next available number
    const maxQueue = await prisma.appointment.aggregate({
      where: { doctorId, date: { gte: start, lte: end }, queueNumber: { not: null } },
      _max: { queueNumber: true },
    });
    priorityQueue = (maxQueue._max.queueNumber ?? 0) + 1;
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { arrivalStatus: "arrived", holdReason: null, queueNumber: priorityQueue, returnedFromTest: true },
  });

  revalidatePath("/[locale]/doctor", "page");
  revalidatePath("/[locale]/secretary", "page");
  revalidatePath("/[locale]/waiting", "page");
  return { success: true };
}

export async function callOnHoldPatient(appointmentId: string, doctorId: string) {
  // Mark current with_doctor or called as done first
  await prisma.appointment.updateMany({
    where: { doctorId, arrivalStatus: { in: ["with_doctor", "called"] } },
    data: { arrivalStatus: "done", status: "completed", completedAt: new Date() },
  });

  // Set on_hold patient to called directly
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { arrivalStatus: "called", holdReason: null, returnedFromTest: true },
  });

  revalidatePath("/[locale]/doctor", "page");
  revalidatePath("/[locale]/secretary", "page");
  revalidatePath("/[locale]/waiting", "page");
  return { success: true };
}

// ── Secretary: Delete/Edit appointments with audit ──────────────
export async function secretaryDeleteAppointment(appointmentId: string, doctorId: string, secretaryId: string) {
  const apt = await prisma.appointment.findFirst({ where: { id: appointmentId, doctorId } });
  if (!apt) return { success: false };

  const secretary = await prisma.user.findUnique({
    where: { id: secretaryId },
    select: { name: true },
  });

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "deleted",
      deletedBy: secretaryId,
      deletedByRole: "secretary",
      deletedAt: new Date(),
      deleteNote: `حذف بواسطة السكرتير: ${secretary?.name ?? "سكرتير"}`,
    },
  });

  revalidatePath("/[locale]/secretary", "page");
  revalidatePath("/[locale]/doctor", "page");
  return { success: true };
}

export async function secretaryEditAppointment(
  appointmentId: string,
  doctorId: string,
  secretaryId: string,
  data: { date?: string; time?: string; type?: string; notes?: string; reason?: string }
) {
  const apt = await prisma.appointment.findFirst({ where: { id: appointmentId, doctorId } });
  if (!apt) return { success: false };

  let newDate = apt.date;
  if (data.date && data.time) {
    const [y, m, d] = data.date.split("-").map(Number);
    const [h, min] = data.time.split(":").map(Number);
    newDate = new Date(y, m - 1, d, h, min, 0);
  }

  const secretary = await prisma.user.findUnique({ where: { id: secretaryId }, select: { name: true } });

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      date: newDate,
      type: data.type ?? apt.type,
      notes: data.notes ?? apt.notes,
      reason: data.reason ?? apt.reason,
      editedBy: secretaryId,
      editNote: `عُدِّل بواسطة السكرتير: ${secretary?.name ?? "سكرتير"}`,
    },
  });

  revalidatePath("/[locale]/secretary", "page");
  revalidatePath("/[locale]/doctor", "page");
  return { success: true };
}
