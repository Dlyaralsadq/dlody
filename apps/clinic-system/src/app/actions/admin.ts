"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { normalizeAccountEmail } from "@/lib/realEmail";
import { makePendingUsername } from "@/lib/usernamePolicy";
import { deliverEmailCode } from "@/app/actions/contactVerification";

async function countOrZero(query: Promise<number>) {
  try {
    return await query;
  } catch {
    return 0;
  }
}

export async function getAdminStats() {
  const [totalDoctors, activeDoctors, totalSpecialties, totalPatients, doctorsWithAccounts, registeredPatients, platformVisits] =
    await Promise.all([
      prisma.doctor.count(),
      prisma.doctor.count({ where: { isActive: true } }),
      prisma.specialty.count(),
      prisma.patient.count(),
      prisma.doctor.count({ where: { userId: { not: null } } }),
      prisma.user.count({ where: { role: "patient" } }),
      countOrZero(prisma.platformVisit.count()),
    ]);

  return {
    totalDoctors,
    activeDoctors,
    totalSpecialties,
    totalPatients,
    doctorsWithAccounts,
    registeredPatients,
    platformVisits,
  };
}

export async function getDoctorsWithAccounts() {
  const doctors = await prisma.doctor.findMany({
    include: {
      specialty: true,
      user: { select: { id: true, username: true, isActive: true, createdAt: true } },
      _count: { select: { appointments: true, patients: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const views = await prisma.doctorPageView.groupBy({
    by: ["doctorId", "kind"],
    _count: { _all: true },
  }).catch(() => [] as { doctorId: string; kind: string; _count: { _all: number } }[]);

  const profileViews = new Map<string, number>();
  const clinicViews = new Map<string, number>();
  for (const row of views) {
    if (row.kind === "clinic") clinicViews.set(row.doctorId, row._count._all);
    else profileViews.set(row.doctorId, (profileViews.get(row.doctorId) ?? 0) + row._count._all);
  }

  return doctors.map((doctor) => ({
    ...doctor,
    profileViews: profileViews.get(doctor.id) ?? 0,
    clinicViews: clinicViews.get(doctor.id) ?? 0,
  }));
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
  const { username, password, email: rawEmail, ...doctorData } = data;
  const checkedEmail = await normalizeAccountEmail(rawEmail);
  if (checkedEmail.status === "error") return { success: false, error: checkedEmail.error };
  const email = checkedEmail.status === "ok" ? checkedEmail.email : null;
  if (!email) return { success: false, error: "email_required" };

  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) {
    return { success: false, error: "username_taken" };
  }
  if (email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) return { success: false, error: "email_taken" };
  }

  const hashedPwd = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPwd,
      name: data.nameAr || data.name,
      role: "doctor",
      email,
      emailVerified: false,
      phone: data.phone?.replace(/\D/g, "") || null,
    },
  });

  await prisma.doctor.create({
    data: {
      ...doctorData,
      email,
      userId: user.id,
    },
  });
  await deliverEmailCode(user.id, "ar");

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
  const next = { ...data };
  let emailUpdate: string | null | undefined;
  if (next.email !== undefined) {
    const checkedEmail = await normalizeAccountEmail(next.email);
    if (checkedEmail.status === "error") return { success: false, error: checkedEmail.error };
    emailUpdate = checkedEmail.status === "ok" ? checkedEmail.email : null;
    delete next.email;
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { userId: true, email: true } });
    if (doctor?.userId && (doctor.email ?? "") !== (emailUpdate ?? "")) {
      if (emailUpdate) {
        const taken = await prisma.user.findFirst({
          where: { email: emailUpdate, NOT: { id: doctor.userId } },
        });
        if (taken) return { success: false, error: "email_taken" };
      }
      await prisma.user.update({
        where: { id: doctor.userId },
        data: { email: emailUpdate, emailVerified: false },
      });
    }
  }

  await prisma.doctor.update({
    where: { id: doctorId },
    data: { ...next, ...(emailUpdate !== undefined ? { email: emailUpdate } : {}) },
  });
  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

export async function createAccountForDoctor(doctorId: string, username: string, password: string) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, include: { user: true } });
  if (!doctor) return { success: false, error: "doctor_not_found" };
  if (doctor.userId) return { success: false, error: "already_has_account" };

  if (!doctor.email) return { success: false, error: "email_required" };
  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) return { success: false, error: "username_taken" };
  const emailTaken = await prisma.user.findUnique({ where: { email: doctor.email } });
  if (emailTaken) return { success: false, error: "email_taken" };

  const hashedPwd = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPwd,
      name: doctor.nameAr || doctor.name,
      role: "doctor",
      email: doctor.email,
      emailVerified: false,
      phone: doctor.phone,
    },
  });

  await prisma.doctor.update({ where: { id: doctorId }, data: { userId: user.id } });
  await deliverEmailCode(user.id, "ar");

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

export async function createSecretaryAccount(doctorId: string, emailRaw: string, password: string, name: string) {
  const checked = await normalizeAccountEmail(emailRaw);
  if (checked.status === "error") return { success: false, error: checked.error };
  if (checked.status !== "ok") return { success: false, error: "email_required" };
  const existing = await prisma.user.findUnique({ where: { email: checked.email } });
  if (existing) return { success: false, error: "email_taken" };

  const hashedPwd = await hashPassword(password);
  const created = await prisma.user.create({
    data: {
      username: makePendingUsername(),
      password: hashedPwd,
      name,
      email: checked.email,
      emailVerified: false,
      role: "secretary",
      linkedDoctorId: doctorId,
    },
  });
  await deliverEmailCode(created.id, "ar");

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
  const [doctor, subscription, secretaries, appointmentsCount, profileViews, clinicViews] = await Promise.all([
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
    countOrZero(prisma.doctorPageView.count({ where: { doctorId, kind: "profile" } })),
    countOrZero(prisma.doctorPageView.count({ where: { doctorId, kind: "clinic" } })),
  ]);

  return {
    doctor,
    subscription,
    isSubscribed: subscription ? subscription.expiresAt > now : false,
    secretaries,
    totalAppointments: appointmentsCount,
    profileViews,
    clinicViews,
  };
}
