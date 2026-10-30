"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendMessage, getAdminUserId } from "./messages";

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
