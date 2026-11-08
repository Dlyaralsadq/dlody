"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  sendVerificationCode,
  isEmailConfigured,
  isWhatsappConfigured,
} from "@/lib/notify";

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MAX_REQUESTS_PER_HOUR = 8;

function normalizeDigits(v: string): string {
  return v.replace(/\D/g, "");
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return "***";
  return `${name.slice(0, 1)}***@${domain}`;
}

export type ContactVerifyPurpose = "email" | "phone";

export async function getContactVerificationStatus(userId?: string): Promise<{
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
} | null> {
  const session = await getSession();
  const id = userId ?? session?.userId;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      email: true,
      phone: true,
      username: true,
      emailVerified: true,
      phoneVerified: true,
      doctor: { select: { email: true, phone: true } },
    },
  });
  if (!user) return null;

  const email = user.email ?? user.doctor?.email ?? null;
  const phone = user.phone ?? user.doctor?.phone ?? (user.username.match(/^\d{7,}$/) ? user.username : null);

  return {
    email,
    phone,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
  };
}

/**
 * Request an OTP to verify email (sent to that inbox)
 * or phone (sent by WhatsApp to that number).
 */
export async function requestContactVerification(
  purpose: ContactVerifyPurpose,
  locale: string = "ar",
  /** Optional override when setting a new email/phone before verifying. */
  newValue?: string
): Promise<{
  success: boolean;
  error?: string;
  channel?: "email" | "sms" | "whatsapp";
  destinationHint?: string;
  devCode?: string;
  devReason?: string;
}> {
  const ar = locale === "ar";
  const session = await getSession();
  if (!session) return { success: false, error: "unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { doctor: { select: { email: true, phone: true, id: true } } },
  });
  if (!user) return { success: false, error: "unauthorized" };

  const recentCount = await prisma.contactVerificationToken.count({
    where: {
      userId: user.id,
      purpose,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recentCount >= MAX_REQUESTS_PER_HOUR) {
    return { success: false, error: "rate_limited" };
  }

  let phone = user.phone ?? user.doctor?.phone ?? (user.username.match(/^\d{7,}$/) ? user.username : null);
  phone = phone ? normalizeDigits(phone) : null;

  if (purpose === "email") {
    const emailRaw = (newValue ?? user.email ?? user.doctor?.email ?? "").trim().toLowerCase();
    if (!emailRaw || !isEmail(emailRaw)) {
      return { success: false, error: "email_required" };
    }

    const taken = await prisma.user.findFirst({
      where: { email: emailRaw, NOT: { id: user.id } },
    });
    if (taken) return { success: false, error: "email_taken" };

    await prisma.user.update({
      where: { id: user.id },
      data: { email: emailRaw, emailVerified: false },
    });
    if (user.doctor) {
      await prisma.doctor.update({
        where: { id: user.doctor.id },
        data: { email: emailRaw },
      });
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const { delivered, channel } = await sendVerificationCode({
      purpose: "email",
      email: emailRaw,
      code,
      name: user.name,
      ar,
    });

    await prisma.contactVerificationToken.create({
      data: {
        userId: user.id,
        purpose: "email",
        codeHash: hashCode(code),
        destination: emailRaw,
        channel: channel ?? "email",
        expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
      },
    });

    const hint = maskEmail(emailRaw);
    if (!delivered) {
      if (process.env.NODE_ENV === "production" || isEmailConfigured()) {
        return { success: false, error: "delivery_failed" };
      }
      return {
        success: true,
        channel: "email",
        destinationHint: hint,
        devCode: code,
        devReason: ar
          ? "لم يتم إعداد البريد بعد — استخدم هذا الرمز لتأكيد البريد على هذا الجهاز"
          : "Email is not configured yet — use this code on this machine",
      };
    }
    return { success: true, channel: channel ?? "email", destinationHint: hint };
  }

  // purpose === "phone"
  const phoneRaw = normalizeDigits(newValue ?? phone ?? "");
  if (phoneRaw.length < 7) return { success: false, error: "phone_required" };

  const takenPhone = await prisma.user.findFirst({
    where: {
      OR: [{ phone: phoneRaw }, { username: phoneRaw }],
      NOT: { id: user.id },
    },
  });
  if (takenPhone) return { success: false, error: "phone_taken" };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      phone: phoneRaw,
      phoneVerified: false,
      // Keep patient login username in sync with phone when they are a patient.
      ...(user.role === "patient" ? { username: phoneRaw } : {}),
    },
  });
  if (user.doctor) {
    await prisma.doctor.update({
      where: { id: user.doctor.id },
      data: { phone: phoneRaw },
    });
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  const { delivered, channel } = await sendVerificationCode({
    purpose: "phone",
    phone: phoneRaw,
    code,
    name: user.name,
    ar,
  });

  await prisma.contactVerificationToken.create({
    data: {
      userId: user.id,
      purpose: "phone",
      codeHash: hashCode(code),
      destination: phoneRaw,
      channel: channel ?? "whatsapp",
      expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
    },
  });

  const hint = phoneRaw.length >= 4 ? `***${phoneRaw.slice(-4)}` : phoneRaw;
  if (!delivered) {
    if (process.env.NODE_ENV === "production" || isWhatsappConfigured()) {
      return { success: false, error: "delivery_failed" };
    }
    return {
      success: true,
      channel: "whatsapp",
      destinationHint: hint,
      devCode: code,
      devReason: ar
        ? "لم يتم إعداد واتساب بعد — استخدم هذا الرمز لتأكيد الرقم على هذا الجهاز"
        : "WhatsApp is not configured yet — use this code on this machine",
    };
  }
  return { success: true, channel: channel ?? "whatsapp", destinationHint: hint };
}

export async function confirmContactVerification(
  purpose: ContactVerifyPurpose,
  code: string,
  locale: string = "ar"
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: "unauthorized" };

  const trimmed = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(trimmed)) return { success: false, error: "invalid_code" };

  const token = await prisma.contactVerificationToken.findFirst({
    where: {
      userId: session.userId,
      purpose,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!token) return { success: false, error: "invalid_code" };

  if (token.attempts >= MAX_ATTEMPTS) {
    return { success: false, error: "too_many_attempts" };
  }

  const ok = token.codeHash === hashCode(trimmed);
  if (!ok) {
    await prisma.contactVerificationToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    });
    return { success: false, error: "invalid_code" };
  }

  await prisma.$transaction([
    prisma.contactVerificationToken.update({
      where: { id: token.id },
      data: { used: true },
    }),
    prisma.user.update({
      where: { id: session.userId },
      data:
        purpose === "email"
          ? { emailVerified: true, email: token.destination }
          : { phoneVerified: true, phone: token.destination },
    }),
  ]);

  revalidatePath(`/${locale}`);
  return { success: true };
}
