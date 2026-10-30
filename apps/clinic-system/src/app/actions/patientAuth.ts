"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword, login, SESSION_COOKIE_NAME } from "@/lib/auth";
import { calcAge } from "@/lib/requirePatient";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function getPatientProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      gender: true,
      dateOfBirth: true,
      bloodType: true,
    },
  });
}

export async function updatePatientProfile(
  userId: string,
  data: {
    name: string;
    gender: string;
    dateOfBirth: string;
    bloodType: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "patient") return { success: false, error: "not_found" };

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name.trim(),
      gender: data.gender || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      bloodType: data.bloodType || null,
    },
  });

  revalidatePath("/[locale]/patient/account", "page");
  return { success: true };
}

export async function registerPatientAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const phone = normalizePhone((formData.get("phone") as string) ?? "");
  const password = formData.get("password") as string;
  const gender = (formData.get("gender") as string) || null;
  const dateOfBirth = (formData.get("dateOfBirth") as string) || null;
  const bloodType = (formData.get("bloodType") as string) || null;
  const locale = (formData.get("locale") as string) ?? "ar";

  if (!name || phone.length < 10 || !password || password.length < 6) {
    return { success: false, error: "invalid_data" };
  }

  const existing = await prisma.user.findUnique({ where: { username: phone } });
  if (existing) {
    return { success: false, error: "phone_taken" };
  }

  const hashed = await hashPassword(password);
  await prisma.user.create({
    data: {
      username: phone,
      password: hashed,
      name,
      role: "patient",
      isActive: true,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      bloodType,
    },
  });

  const result = await login(phone, password);
  if (result.success && result.session) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME(), result.session, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    revalidatePath(`/${locale}/patient`);
    return { success: true };
  }

  return { success: false, error: "register_failed" };
}

export async function patientLoginAction(formData: FormData) {
  const phone = normalizePhone((formData.get("phone") as string) ?? "");
  const password = formData.get("password") as string;
  const locale = (formData.get("locale") as string) ?? "ar";

  const result = await login(phone, password);
  if (!result.success || result.role !== "patient") {
    return { success: false, error: "invalid_credentials" };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME(), result.session!, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath(`/${locale}/patient`);
  return { success: true };
}

export async function getPatientAppointments(phone: string) {
  const normalized = normalizePhone(phone);
  return prisma.appointment.findMany({
    where: {
      patientPhone: normalized,
      source: "online",
      status: { not: "deleted" },
    },
    include: {
      doctor: { include: { specialty: true } },
      patient: true,
    },
    orderBy: { date: "desc" },
    take: 50,
  });
}

export async function cancelPatientAppointment(appointmentId: string, phone: string) {
  const normalized = normalizePhone(phone);
  const apt = await prisma.appointment.findFirst({
    where: { id: appointmentId, patientPhone: normalized, status: { notIn: ["cancelled", "completed", "deleted"] } },
  });
  if (!apt) return { success: false, error: "not_found" };

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "cancelled" },
  });

  revalidatePath("/[locale]/patient/account", "page");
  return { success: true };
}

export { calcAge };
