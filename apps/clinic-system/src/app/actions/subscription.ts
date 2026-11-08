"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { sendMessage, getAdminUserId } from "./messages";

const DEFAULT_MONTHLY = 50000;
const DEFAULT_YEARLY = 480000;

export type SubscriptionPricing = {
  monthlyPrice: number;
  yearlyPrice: number;
};

export async function getSubscriptionPricing(): Promise<SubscriptionPricing> {
  const row = await prisma.platformSettings.findUnique({ where: { id: "default" } });
  if (!row) {
    const created = await prisma.platformSettings.create({
      data: { id: "default", monthlyPrice: DEFAULT_MONTHLY, yearlyPrice: DEFAULT_YEARLY },
    });
    return { monthlyPrice: created.monthlyPrice, yearlyPrice: created.yearlyPrice };
  }
  return { monthlyPrice: row.monthlyPrice, yearlyPrice: row.yearlyPrice };
}

export async function updateSubscriptionPricing(
  monthlyPrice: number,
  yearlyPrice: number
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { success: false, error: "unauthorized" };

  const monthly = Math.round(Number(monthlyPrice));
  const yearly = Math.round(Number(yearlyPrice));
  if (!Number.isFinite(monthly) || !Number.isFinite(yearly) || monthly < 0 || yearly < 0) {
    return { success: false, error: "invalid" };
  }

  await prisma.platformSettings.upsert({
    where: { id: "default" },
    update: { monthlyPrice: monthly, yearlyPrice: yearly },
    create: { id: "default", monthlyPrice: monthly, yearlyPrice: yearly },
  });

  revalidatePath("/[locale]/subscribe", "page");
  revalidatePath("/[locale]/admin", "page");
  return { success: true };
}

export async function setDoctorSubscription(doctorId: string, expiresAt: Date) {
  await prisma.doctorSubscription.upsert({
    where: { doctorId },
    update: { expiresAt, notified: false },
    create: { doctorId, expiresAt, notified: false },
  });
  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

export async function getDoctorSubscriptions() {
  return prisma.doctorSubscription.findMany({
    orderBy: { expiresAt: "asc" },
  });
}

export async function checkAndSendSubscriptionReminders() {
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const expiring = await prisma.doctorSubscription.findMany({
    where: {
      expiresAt: { lte: twoDaysFromNow, gte: now },
      notified: false,
    },
  });

  const adminId = await getAdminUserId();

  for (const sub of expiring) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: sub.doctorId },
      include: { user: true },
    });

    if (doctor?.user?.id) {
      const daysLeft = Math.ceil((sub.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const msg = `تنبيه: ينتهي اشتراكك في النظام خلال ${daysLeft} يوم${daysLeft === 1 ? "" : ""}. يرجى التواصل مع مدير النظام لتجديد الاشتراك.`;
      await sendMessage("system", doctor.user.id, msg);

      // Notify admin too
      if (adminId) {
        await sendMessage("system", adminId, `تنبيه: اشتراك د. ${doctor.nameAr} ينتهي خلال ${daysLeft} يوم.`);
      }

      await prisma.doctorSubscription.update({
        where: { id: sub.id },
        data: { notified: true },
      });
    }
  }
  return { checked: expiring.length };
}
