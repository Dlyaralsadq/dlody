"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateId } from "@/lib/utils";
import { isAppointmentSlotAvailable } from "@/app/actions/appointmentAvailability";

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
  patientNationalId: string;          // required
  patientNameAr?: string;
  date: string;
  time: string;
  type?: string;
  reason?: string;
  notes?: string;
  existingPatientId?: string;
}): Promise<{ success: boolean; error?: string }> {
  // Validate national ID
  const nationalId = data.patientNationalId?.trim();
  if (!nationalId) return { success: false, error: "national_id_required" };

  const available = await isAppointmentSlotAvailable(doctorId, data.date, data.time);
  if (!available) return { success: false, error: "slot_taken" };

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
        nationalId,
        patientNumber,
        doctorId,
      },
    });
    patientId = patient.id;
  } else {
    // Update nationalId on existing patient if not already set
    await prisma.patient.update({
      where: { id: patientId },
      data: { nationalId: nationalId },
    });
  }

  const appointmentNumber = generateId("APT");
  // Parse as local time to avoid UTC offset shifting the date
  const [year, month, day] = data.date.split("-").map(Number);
  const [hour, minute] = data.time.split(":").map(Number);
  const dateTime = new Date(year, month - 1, day, hour, minute, 0);

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { appointmentDuration: true } });

  const notesParts: string[] = [];
  if (data.notes) notesParts.push(data.notes);
  notesParts.push(`رقم الهوية: ${nationalId}`);

  await prisma.appointment.create({
    data: {
      appointmentNumber,
      patientId,
      doctorId,
      date: dateTime,
      duration: doctor?.appointmentDuration && doctor.appointmentDuration > 0 ? doctor.appointmentDuration : 30,
      type: data.type ?? "consultation",
      status: "scheduled",
      reason: data.reason,
      notes: notesParts.join(" · "),
      patientNationalId: nationalId,
    },
  });

  revalidatePath("/[locale]/secretary", "page");
  revalidatePath("/[locale]/doctor", "page");
  return { success: true };
}

// ─── Patient national-ID lookup for auto-fill in booking form ──────────────
export async function lookupPatientByNationalId(doctorId: string, nationalId: string): Promise<{
  id: string;
  name: string;
  nameAr: string | null;
  phone: string;
  gender: string;
  nationalId: string | null;
  bloodType: string | null;
  visitCount: number;
  lastVisit: {
    date: Date;
    diagnosis: string | null;
    prescription: string | null;
    notes: string | null;
    type: string;
    appointmentNumber: string;
  } | null;
} | null> {
  const trimmed = nationalId.trim();
  if (!trimmed || trimmed.length < 3) return null;

  const patient = await prisma.patient.findFirst({
    where: { doctorId, nationalId: trimmed },
    include: {
      appointments: {
        where: { status: "completed", deletedAt: null },
        orderBy: { date: "desc" },
        take: 1,
        select: {
          date: true,
          diagnosis: true,
          prescription: true,
          notes: true,
          type: true,
          appointmentNumber: true,
        },
      },
      _count: { select: { appointments: { where: { status: "completed" } } } },
    },
  });

  if (!patient) return null;

  const last = patient.appointments[0] ?? null;
  return {
    id: patient.id,
    name: patient.name,
    nameAr: patient.nameAr,
    phone: patient.phone,
    gender: patient.gender,
    nationalId: patient.nationalId,
    bloodType: patient.bloodType,
    visitCount: patient._count.appointments,
    lastVisit: last ? {
      date: last.date,
      diagnosis: last.diagnosis,
      prescription: last.prescription,
      notes: last.notes,
      type: last.type,
      appointmentNumber: last.appointmentNumber,
    } : null,
  };
}

// ─── Patient phone lookup for auto-fill in booking form ────────────────────
export async function lookupPatientByPhone(doctorId: string, phone: string): Promise<{
  id: string;
  name: string;
  nameAr: string | null;
  phone: string;
  gender: string;
  nationalId: string | null;
  bloodType: string | null;
  visitCount: number;
  lastVisit: {
    date: Date;
    diagnosis: string | null;
    prescription: string | null;
    notes: string | null;
    type: string;
    appointmentNumber: string;
  } | null;
} | null> {
  const normalized = phone.replace(/\D/g, "");
  if (!normalized || normalized.length < 7) return null;

  const patient = await prisma.patient.findFirst({
    where: {
      doctorId,
      OR: [
        { phone: { contains: normalized } },
        { phone: normalized },
      ],
    },
    include: {
      appointments: {
        where: { status: "completed", deletedAt: null },
        orderBy: { date: "desc" },
        take: 1,
        select: {
          date: true,
          diagnosis: true,
          prescription: true,
          notes: true,
          type: true,
          appointmentNumber: true,
        },
      },
      _count: {
        select: {
          appointments: { where: { status: "completed" } },
        },
      },
    },
  });

  if (!patient) return null;

  const last = patient.appointments[0] ?? null;
  return {
    id: patient.id,
    name: patient.name,
    nameAr: patient.nameAr,
    phone: patient.phone,
    gender: patient.gender,
    nationalId: patient.nationalId,
    bloodType: patient.bloodType,
    visitCount: patient._count.appointments,
    lastVisit: last ? {
      date: last.date,
      diagnosis: last.diagnosis,
      prescription: last.prescription,
      notes: last.notes,
      type: last.type,
      appointmentNumber: last.appointmentNumber,
    } : null,
  };
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
  const doctor = isPaid
    ? await prisma.doctor.findUnique({ where: { id: doctorId }, select: { consultationFee: true } })
    : null;
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      isPaid,
      feeAmount: isPaid ? (apt.feeAmount ?? doctor?.consultationFee ?? null) : apt.feeAmount,
    },
  });
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
): Promise<{ success: boolean; error?: string }> {
  const apt = await prisma.appointment.findFirst({ where: { id: appointmentId, doctorId } });
  if (!apt) return { success: false };

  let newDate = apt.date;
  if (data.date && data.time) {
    const available = await isAppointmentSlotAvailable(doctorId, data.date, data.time, {
      excludeAppointmentId: appointmentId,
    });
    if (!available) return { success: false, error: "slot_taken" };

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

// ─── Patient medical history (for doctor portal patient file) ───
export async function getPatientHistoryForDoctor(doctorId: string, patientId: string) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, doctorId },
    select: {
      id: true, name: true, nameAr: true, phone: true, gender: true,
      nationalId: true, bloodType: true, medicalHistory: true, allergies: true,
      dateOfBirth: true, patientNumber: true,
    },
  });
  if (!patient) return null;

  const appointments = await prisma.appointment.findMany({
    where: { doctorId, patientId, status: "completed", deletedAt: null },
    orderBy: { completedAt: "desc" },
    select: {
      id: true, appointmentNumber: true, date: true, completedAt: true,
      type: true, reason: true, diagnosis: true, prescription: true, notes: true,
      queueNumber: true,
    },
  });

  return { patient, appointments };
}
