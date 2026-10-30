"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateId } from "@/lib/utils";
import { hashPassword, getSession } from "@/lib/auth";
import { parseCustomTreatmentTypes, type TreatmentTypeOption } from "@/lib/treatmentTypes";

export async function createSecretaryForDoctor(
  doctorId: string,
  data: { name: string; username: string; password: string }
): Promise<{ success: boolean; error?: string }> {
  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing) return { success: false, error: "username_taken" };

  const hashed = await hashPassword(data.password);
  await prisma.user.create({
    data: {
      username: data.username,
      password: hashed,
      name: data.name,
      role: "secretary",
      linkedDoctorId: doctorId,
      isActive: true,
    },
  });

  revalidatePath("/[locale]/doctor/settings", "page");
  return { success: true };
}

export async function getSecretariesForDoctorPortal(doctorId: string) {
  return prisma.user.findMany({
    where: { linkedDoctorId: doctorId, role: "secretary" },
    select: { id: true, username: true, name: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getDoctorByUserId(userId: string) {
  return prisma.doctor.findUnique({
    where: { userId },
    include: { specialty: true },
  });
}

export async function getDoctorStats(doctorId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [totalPatients, todayAppointments, pendingAppointments, upcomingAppointments] =
    await Promise.all([
      prisma.patient.count({ where: { doctorId } }),
      prisma.appointment.count({ where: { doctorId, date: { gte: today, lte: todayEnd } } }),
      prisma.appointment.count({ where: { doctorId, status: "scheduled" } }),
      prisma.appointment.findMany({
        where: { doctorId, date: { gte: new Date() }, status: { in: ["scheduled", "confirmed"] } },
        include: { patient: true },
        orderBy: { date: "asc" },
        take: 8,
      }),
    ]);

  return { totalPatients, todayAppointments, pendingAppointments, upcomingAppointments };
}

export async function getDoctorPatients(doctorId: string, search?: string) {
  return prisma.patient.findMany({
    where: {
      doctorId,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { nameAr: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    },
    include: { _count: { select: { appointments: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDoctorAppointments(doctorId: string, status?: string) {
  return prisma.appointment.findMany({
    where: {
      doctorId,
      ...(status ? { status } : {}),
    },
    include: { patient: true },
    orderBy: { date: "desc" },
  });
}

export async function createPatientForDoctor(
  doctorId: string,
  data: {
    name: string;
    nameAr?: string;
    dateOfBirth?: string;
    gender: string;
    phone: string;
    email?: string;
    bloodType?: string;
    nationalId?: string;
    insurance?: string;
    medicalHistory?: string;
    allergies?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  }
) {
  const patientNumber = generateId("P");
  await prisma.patient.create({
    data: {
      ...data,
      patientNumber,
      doctorId,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
    },
  });
  revalidatePath("/[locale]/doctor/patients", "page");
  return { success: true };
}

export async function updatePatientForDoctor(patientId: string, doctorId: string, data: Parameters<typeof createPatientForDoctor>[1]) {
  const patient = await prisma.patient.findFirst({ where: { id: patientId, doctorId } });
  if (!patient) return { success: false, error: "unauthorized" };

  await prisma.patient.update({
    where: { id: patientId },
    data: { ...data, dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined },
  });
  revalidatePath("/[locale]/doctor/patients", "page");
  return { success: true };
}

export async function createAppointmentForDoctor(
  doctorId: string,
  data: {
    patientId: string;
    date: string;
    duration?: number;
    type?: string;
    status?: string;
    reason?: string;
    notes?: string;
  }
) {
  const appointmentNumber = generateId("APT");
  await prisma.appointment.create({
    data: {
      ...data,
      doctorId,
      appointmentNumber,
      date: new Date(data.date),
      duration: data.duration ?? 30,
      type: data.type ?? "consultation",
      status: data.status ?? "scheduled",
    },
  });
  revalidatePath("/[locale]/doctor/appointments", "page");
  return { success: true };
}

export async function updateAppointmentStatus(appointmentId: string, doctorId: string, status: string) {
  const appointment = await prisma.appointment.findFirst({ where: { id: appointmentId, doctorId } });
  if (!appointment) return { success: false };

  await prisma.appointment.update({ where: { id: appointmentId }, data: { status } });
  revalidatePath("/[locale]/doctor/appointments", "page");
  return { success: true };
}

export async function updateDoctorSettings(
  doctorId: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "doctor") {
    return { success: false, error: "unauthorized" };
  }

  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, userId: session.userId },
  });
  if (!doctor) return { success: false, error: "not_found" };

  const allowed: Record<string, unknown> = {};
  const fields = [
    "name", "nameAr", "bio", "bioAr", "specialtyId", "phone", "email",
    "licenseNumber", "qualification", "qualificationAr", "experienceYears",
    "consultationFee", "workingDays", "workingHoursStart", "workingHoursEnd",
    "clinicAddress", "clinicLat", "clinicLng", "logoUrl",
  ];
  for (const f of fields) {
    if (data[f] !== undefined) allowed[f] = data[f];
  }

  if (typeof allowed.logoUrl === "string" && allowed.logoUrl.length > 400_000) {
    delete allowed.logoUrl;
  }

  await prisma.doctor.update({ where: { id: doctorId }, data: allowed });

  revalidatePath("/[locale]/doctor/settings", "page");
  revalidatePath("/[locale]/patient", "page");
  revalidatePath("/[locale]/patient/doctor/[id]", "page");

  return { success: true };
}

export async function getDoctorTreatmentTypes(doctorId: string): Promise<TreatmentTypeOption[]> {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { customTreatmentTypes: true },
  });
  return parseCustomTreatmentTypes(doctor?.customTreatmentTypes);
}

export async function saveDoctorTreatmentTypes(
  doctorId: string,
  types: TreatmentTypeOption[]
): Promise<{ success: boolean }> {
  const session = await getSession();
  if (!session || session.role !== "doctor") return { success: false };

  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, userId: session.userId },
  });
  if (!doctor) return { success: false };

  await prisma.doctor.update({
    where: { id: doctorId },
    data: { customTreatmentTypes: JSON.stringify(types) },
  });

  revalidatePath("/[locale]/doctor/recurring", "page");
  return { success: true };
}
