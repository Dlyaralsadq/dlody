"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/auth";
import { generateId } from "@/lib/utils";

export async function getAdminStats() {
  const [totalDoctors, activeDoctors, totalSpecialties, totalPatients, doctorsWithAccounts] =
    await Promise.all([
      prisma.doctor.count(),
      prisma.doctor.count({ where: { isActive: true } }),
      prisma.specialty.count(),
      prisma.patient.count(),
      prisma.doctor.count({ where: { userId: { not: null } } }),
    ]);

  return { totalDoctors, activeDoctors, totalSpecialties, totalPatients, doctorsWithAccounts };
}

export async function getDoctorsWithAccounts() {
  return prisma.doctor.findMany({
    include: {
      specialty: true,
      user: { select: { id: true, username: true, isActive: true, createdAt: true } },
      _count: { select: { appointments: true, patients: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createDoctorWithAccount(data: {
  name: string;
  nameAr: string;
  email?: string;
  phone?: string;
  specialtyId: string;
  licenseNumber?: string;
  qualification?: string;
  qualificationAr?: string;
  experienceYears?: number;
  consultationFee?: number;
  workingDays?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  username: string;
  password: string;
}) {
  const { username, password, ...doctorData } = data;

  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) {
    return { success: false, error: "username_taken" };
  }

  const hashedPwd = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPwd,
      name: data.nameAr || data.name,
      role: "doctor",
    },
  });

  await prisma.doctor.create({
    data: {
      ...doctorData,
      userId: user.id,
    },
  });

  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

export async function updateDoctorAndAccount(
  doctorId: string,
  data: {
    name?: string;
    nameAr?: string;
    email?: string;
    phone?: string;
    specialtyId?: string;
    licenseNumber?: string;
    qualification?: string;
    experienceYears?: number;
    consultationFee?: number;
    workingDays?: string;
    workingHoursStart?: string;
    workingHoursEnd?: string;
    isActive?: boolean;
    logoUrl?: string;
    clinicLat?: number;
    clinicLng?: number;
    clinicAddress?: string;
  }
) {
  await prisma.doctor.update({ where: { id: doctorId }, data });
  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

export async function createAccountForDoctor(doctorId: string, username: string, password: string) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, include: { user: true } });
  if (!doctor) return { success: false, error: "doctor_not_found" };
  if (doctor.userId) return { success: false, error: "already_has_account" };

  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) return { success: false, error: "username_taken" };

  const hashedPwd = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPwd,
      name: doctor.nameAr || doctor.name,
      role: "doctor",
    },
  });

  await prisma.doctor.update({ where: { id: doctorId }, data: { userId: user.id } });

  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

export async function resetDoctorPassword(doctorId: string, newPassword: string) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor?.userId) return { success: false, error: "no_account" };

  const hashedPwd = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: doctor.userId }, data: { password: hashedPwd } });

  return { success: true };
}

export async function toggleDoctorStatus(doctorId: string, isActive: boolean) {
  const doctor = await prisma.doctor.update({
    where: { id: doctorId },
    data: { isActive },
  });

  // Toggle doctor's own account
  if (doctor.userId) {
    await prisma.user.update({ where: { id: doctor.userId }, data: { isActive } });
  }

  // Toggle all secretaries linked to this doctor
  await prisma.user.updateMany({
    where: { linkedDoctorId: doctorId, role: "secretary" },
    data: { isActive },
  });

  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

export async function deleteDoctorAndAccount(doctorId: string) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });

  await prisma.doctor.update({ where: { id: doctorId }, data: { userId: null } });

  if (doctor?.userId) {
    await prisma.user.delete({ where: { id: doctor.userId } });
  }

  await prisma.doctor.delete({ where: { id: doctorId } });

  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

export async function createSecretaryAccount(doctorId: string, username: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return { success: false, error: "username_taken" };

  const hashedPwd = await hashPassword(password);
  await prisma.user.create({
    data: { username, password: hashedPwd, name, role: "secretary", linkedDoctorId: doctorId },
  });

  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

export async function getSecretariesForDoctor(doctorId: string) {
  return prisma.user.findMany({
    where: { linkedDoctorId: doctorId, role: "secretary" },
    select: { id: true, username: true, name: true, isActive: true, createdAt: true },
  });
}

export async function activateDoctorSubscription(doctorId: string, months: number) {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + months);

  await prisma.doctorSubscription.upsert({
    where: { doctorId },
    update: { expiresAt, notified: false },
    create: { doctorId, expiresAt, notified: false },
  });

  // Also make sure doctor is active
  await prisma.doctor.update({ where: { id: doctorId }, data: { isActive: true } });
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (doctor?.userId) {
    await prisma.user.update({ where: { id: doctor.userId }, data: { isActive: true } });
  }

  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

export async function getDoctorFullDetails(doctorId: string) {
  const now = new Date();
  const [doctor, subscription, secretaries, appointmentsCount] = await Promise.all([
    prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        specialty: true,
        user: { select: { id: true, username: true, isActive: true, createdAt: true } },
        _count: { select: { appointments: true, patients: true } },
      },
    }),
    prisma.doctorSubscription.findFirst({ where: { doctorId } }),
    prisma.user.findMany({
      where: { linkedDoctorId: doctorId, role: "secretary" },
      select: { id: true, username: true, name: true, isActive: true },
    }),
    prisma.appointment.count({ where: { doctorId } }),
  ]);

  return {
    doctor,
    subscription,
    isSubscribed: subscription ? subscription.expiresAt > now : false,
    secretaries,
    totalAppointments: appointmentsCount,
  };
}
