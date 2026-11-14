"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  verifyPassword,
  hashPassword,
  createSession,
  setSessionCookie,
} from "@/lib/auth";

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,32}$/;

export async function updateAdminAccount(input: {
  locale: string;
  name: string;
  username: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const locale = (input.locale || "ar").trim();
  const session = await requireAuth(locale);
  const ar = locale === "ar";
  if (session.role !== "admin") {
    return { success: false as const, error: ar ? "غير مصرح" : "Unauthorized" };
  }

  const name = input.name.trim();
  const username = input.username.trim();
  const currentPassword = input.currentPassword ?? "";
  const newPassword = input.newPassword ?? "";
  const confirmPassword = input.confirmPassword ?? "";

  if (name.length < 2 || name.length > 80) {
    return { success: false as const, error: ar ? "اكتب الاسم بين حرفين وثمانين حرفاً" : "Name must be 2–80 characters" };
  }
  if (!USERNAME_RE.test(username)) {
    return {
      success: false as const,
      error: ar
        ? "اسم الدخول من 3 إلى 32 حرفاً: حروف إنجليزية أو أرقام أو . _ -"
        : "Username must be 3–32 characters: letters, numbers, or . _ -",
    };
  }
  if (!currentPassword) {
    return { success: false as const, error: ar ? "أدخل كلمة السر الحالية" : "Enter your current password" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.role !== "admin") {
    return { success: false as const, error: ar ? "غير مصرح" : "Unauthorized" };
  }

  const currentOk = await verifyPassword(currentPassword, user.password);
  if (!currentOk) {
    return { success: false as const, error: ar ? "كلمة السر الحالية غير صحيحة" : "Current password is incorrect" };
  }

  if (username !== user.username) {
    const taken = await prisma.user.findUnique({ where: { username } });
    if (taken) {
      return { success: false as const, error: ar ? "اسم الدخول مستخدم مسبقاً" : "That username is already taken" };
    }
  }

  let passwordHash = user.password;
  const changingPassword = newPassword.length > 0 || confirmPassword.length > 0;
  if (changingPassword) {
    if (newPassword.length < 8) {
      return { success: false as const, error: ar ? "كلمة السر الجديدة 8 أحرف على الأقل" : "New password must be at least 8 characters" };
    }
    if (newPassword !== confirmPassword) {
      return { success: false as const, error: ar ? "تأكيد كلمة السر غير مطابق" : "Password confirmation does not match" };
    }
    passwordHash = await hashPassword(newPassword);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, username, password: passwordHash },
  });

  const token = await createSession(user.id, username, name, user.role, user.isActive);
  await setSessionCookie(token);
  revalidatePath("/[locale]/admin", "layout");
  revalidatePath("/[locale]/admin/account", "page");

  return { success: true as const, passwordChanged: changingPassword };
}
