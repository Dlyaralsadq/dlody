"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword, login, setSessionCookie, getSession } from "@/lib/auth";
import { calcAge } from "@/lib/requirePatient";
import { saveAvatarFile } from "@/lib/postMediaUpload";
import { normalizeAccountEmail } from "@/lib/realEmail";

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
      avatarUrl: true,
      nationalId: true,
      emergencyContact: true,
      emergencyPhone: true,
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
    nationalId?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
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
      nationalId: data.nationalId?.trim() || null,
      emergencyContact: data.emergencyContact?.trim() || null,
      emergencyPhone: data.emergencyPhone?.trim() || null,
    },
  });

  revalidatePath("/[locale]/patient/account", "page");
  return { success: true };
}

export async function uploadPatientAvatar(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "patient") return { success: false, error: "unauthorized" };

  const file = formData.get("file");
  if (!file || !(file instanceof File)) return { success: false, error: "no_file" };

  try {
    const result = await saveAvatarFile(session.userId, file);
    if ("error" in result) return { success: false, error: result.error };

    await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl: result.url },
    });

    revalidatePath("/[locale]/patient/account", "page");
    return { success: true, url: result.url };
  } catch (err) {
    console.error("[uploadPatientAvatar]", err);
    return { success: false, error: "upload_failed" };
  }
}

export async function registerPatientAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const phone = normalizePhone((formData.get("phone") as string) ?? "");
  const emailRaw = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const password = formData.get("password") as string;
  const gender = (formData.get("gender") as string) || null;
  const dateOfBirth = (formData.get("dateOfBirth") as string) || null;
  const bloodType = (formData.get("bloodType") as string) || null;
  const locale = (formData.get("locale") as string) ?? "ar";

  const checkedEmail = await normalizeAccountEmail(emailRaw);
  if (checkedEmail.status === "error") return { success: false, error: checkedEmail.error };
  const email = checkedEmail.status === "ok" ? checkedEmail.email : null;

  if (!name || phone.length < 10 || !password || password.length < 6) {
    return { success: false, error: "invalid_data" };
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: phone }, { phone }] },
  });
  if (existing) {
    return { success: false, error: "phone_taken" };
  }

  if (email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) return { success: false, error: "email_taken" };
  }

  const hashed = await hashPassword(password);
  await prisma.user.create({
    data: {
      username: phone,
      phone,
      phoneVerified: false,
      email,
      emailVerified: false,
      password: hashed,
      name,
      role: "patient",
      isActive: true,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      bloodType,
    },
  });

  const result = await login(phone, password, 60 * 60 * 24 * 30);
  if (result.success && result.session) {
    await setSessionCookie(result.session, 60 * 60 * 24 * 30);
    revalidatePath(`/${locale}/patient`);
    return { success: true, redirectTo: `/${locale}/verify-contact` };
  }

  return { success: false, error: "register_failed" };
}

export async function patientLoginAction(formData: FormData) {
  const identifier =
    ((formData.get("identifier") as string) ?? (formData.get("phone") as string) ?? "").trim();
  const password = formData.get("password") as string;
  const locale = (formData.get("locale") as string) ?? "ar";

  const result = await login(identifier, password, 60 * 60 * 24 * 30);
  if (!result.success || result.role !== "patient" || !result.session) {
    return { success: false as const, error: "invalid_credentials" };
  }

  await setSessionCookie(result.session, 60 * 60 * 24 * 30);
  revalidatePath(`/${locale}/patient`);
  redirect(`/${locale}/patient/updates`);
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
