"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, login, setSessionCookie } from "@/lib/auth";
import { normalizeAccountEmail } from "@/lib/realEmail";
import { deliverEmailCode } from "@/app/actions/contactVerification";

function generatePatientNumber(): string {
  return `DR-${Date.now().toString().slice(-6)}`;
}

export async function registerDoctor(data: {
  nameAr: string;
  name: string;
  username: string;
  password: string;
  phone: string;
  email?: string;
  specialtyId: string;
  clinicAddress?: string;
  clinicLat?: number;
  clinicLng?: number;
  consultationFee?: number;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  locale?: string;
}): Promise<{ success: boolean; error?: string; redirectTo?: string }> {
  const checkedEmail = await normalizeAccountEmail(data.email);
  if (checkedEmail.status === "error") return { success: false, error: checkedEmail.error };
  const email = checkedEmail.status === "ok" ? checkedEmail.email : null;

  // Check username availability
  const existing = await prisma.user.findUnique({
    where: { username: data.username },
  });
  if (existing) return { success: false, error: "username_taken" };

  const phone = data.phone.replace(/\D/g, "");
  if (phone.length < 7) return { success: false, error: "invalid_phone" };

  const phoneTaken = await prisma.user.findFirst({
    where: { OR: [{ phone }, { username: phone }] },
  });
  if (phoneTaken) return { success: false, error: "phone_taken" };

  if (email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) return { success: false, error: "email_taken" };
    const doctorEmailTaken = await prisma.doctor.findUnique({ where: { email } });
    if (doctorEmailTaken) return { success: false, error: "email_taken" };
  }

  // Check specialty exists
  const specialty = await prisma.specialty.findUnique({
    where: { id: data.specialtyId },
  });
  if (!specialty) return { success: false, error: "invalid_specialty" };

  const hashedPwd = await hashPassword(data.password);

  // Create user + doctor in transaction
  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: data.username,
        password: hashedPwd,
        name: data.nameAr || data.name,
        role: "doctor",
        isActive: true,
        phone,
        phoneVerified: false,
        email,
        emailVerified: false,
      },
    });

    await tx.doctor.create({
      data: {
        name: data.name || data.nameAr,
        nameAr: data.nameAr,
        phone,
        email,
        specialtyId: data.specialtyId,
        clinicAddress: data.clinicAddress,
        clinicLat: data.clinicLat,
        clinicLng: data.clinicLng,
        consultationFee: data.consultationFee,
        workingHoursStart: data.workingHoursStart,
        workingHoursEnd: data.workingHoursEnd,
        isActive: true,
        userId: user.id,
      },
    });
    return user;
  });

  const locale = data.locale || "ar";
  if (email) {
    const sent = await deliverEmailCode(created.id, locale);
    const session = await login(data.username, data.password);
    if (session.success && session.session) {
      await setSessionCookie(session.session);
      return {
        success: true,
        redirectTo: sent.success ? `/${locale}/verify-contact?sent=email` : `/${locale}/verify-contact`,
      };
    }
  }

  return { success: true };
}
