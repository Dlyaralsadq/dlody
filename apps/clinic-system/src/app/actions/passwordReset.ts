"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendResetCode, isDeliveryConfigured } from "@/lib/notify";
import { allowRateLimit, clientIp, rateKey } from "@/lib/loginGuard";

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MAX_REQUESTS_PER_HOUR = 5;

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

type Method = "email" | "phone" | "none";

async function findUserByIdentifier(identifierRaw: string): Promise<{
  user: { id: string; name: string; role: string };
  method: Method;
  destination: string;
} | null> {
  const identifier = identifierRaw.trim();
  if (!identifier) return null;

  if (!isEmail(identifier)) return null;

  const email = identifier.toLowerCase();
  const byUserEmail = await prisma.user.findUnique({ where: { email } });
  if (byUserEmail) return { user: byUserEmail, method: "email", destination: email };

  const doctor = await prisma.doctor.findUnique({ where: { email }, include: { user: true } });
  if (doctor?.user) return { user: doctor.user, method: "email", destination: email };
  return null;
}

/**
 * Always returns { success: true } to avoid leaking whether an account
 * exists. `devCode` is only ever populated when the server has no
 * email/SMS/WhatsApp provider configured at all (see `notify.ts`) — in
 * that case the code can't be delivered anywhere, so it's shown directly
 * in the UI as a fallback rather than leaving the reset flow stuck.
 * Once real credentials are set, `devCode` stops being returned.
 */
export async function requestPasswordReset(
  identifier: string,
  locale: string = "ar"
): Promise<{ success: true; devCode?: string; devReason?: string }> {
  const ar = locale === "ar";
  try {
    const ipAllowed = await allowRateLimit(rateKey("reset", await clientIp()), 10, 60 * 60 * 1000, true);
    if (!ipAllowed) return { success: true };
    const match = await findUserByIdentifier(identifier);
    if (match) {
      const { user, method, destination } = match;
      const recentCount = await prisma.passwordResetToken.count({
        where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      });
      if (recentCount < MAX_REQUESTS_PER_HOUR) {
        const code = crypto.randomInt(100000, 1000000).toString();
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            codeHash: hashCode(code),
            method,
            destination,
            expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
          },
        });
        const delivered = await sendResetCode({ method, destination, code, name: user.name, ar });
        if (!delivered && process.env.NODE_ENV !== "production" && !isDeliveryConfigured(method)) {
          return {
            success: true,
            devCode: code,
            devReason: ar
              ? "لم يتم إعداد مزوّد إرسال (بريد/رسائل) بعد على الخادم — استخدم هذا الرمز مباشرة"
              : "No email/SMS provider is configured on the server yet — use this code directly",
          };
        }
      }
    }
  } catch (err) {
    console.error("[requestPasswordReset]", err);
  }
  // Constant-shape response regardless of whether the account was found.
  return { success: true };
}

export async function verifyResetCode(
  identifier: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const match = await findUserByIdentifier(identifier);
  if (!match) return { success: false, error: "invalid_code" };

  const token = await prisma.passwordResetToken.findFirst({
    where: { userId: match.user.id, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!token) return { success: false, error: "invalid_code" };
  if (token.attempts >= MAX_ATTEMPTS) return { success: false, error: "too_many_attempts" };

  if (token.codeHash !== hashCode(code.trim())) {
    await prisma.passwordResetToken.update({ where: { id: token.id }, data: { attempts: { increment: 1 } } });
    return { success: false, error: "invalid_code" };
  }

  return { success: true };
}

export async function resetPasswordWithCode(
  identifier: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; error?: string; role?: string }> {
  if (!newPassword || newPassword.length < 6) return { success: false, error: "weak_password" };

  const match = await findUserByIdentifier(identifier);
  if (!match) return { success: false, error: "invalid_code" };

  const token = await prisma.passwordResetToken.findFirst({
    where: { userId: match.user.id, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!token) return { success: false, error: "invalid_code" };
  if (token.attempts >= MAX_ATTEMPTS) return { success: false, error: "too_many_attempts" };

  if (token.codeHash !== hashCode(code.trim())) {
    await prisma.passwordResetToken.update({ where: { id: token.id }, data: { attempts: { increment: 1 } } });
    return { success: false, error: "invalid_code" };
  }

  const hashed = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: match.user.id }, data: { password: hashed } }),
    prisma.passwordResetToken.update({ where: { id: token.id }, data: { used: true } }),
    prisma.passwordResetToken.updateMany({
      where: { userId: match.user.id, used: false, NOT: { id: token.id } },
      data: { used: true },
    }),
  ]);

  return { success: true, role: match.user.role };
}
