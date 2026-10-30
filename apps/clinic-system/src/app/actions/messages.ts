"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function sendMessage(fromUserId: string, toUserId: string, content: string) {
  await prisma.message.create({
    data: { fromUserId, toUserId, content },
  });
  revalidatePath("/[locale]/admin", "layout");
  revalidatePath("/[locale]/doctor", "layout");
  return { success: true };
}

export async function getMessagesForUser(userId: string) {
  return prisma.message.findMany({
    where: { toUserId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getAdminInbox(adminUserId: string) {
  // Messages sent TO admin from any doctor
  const messages = await prisma.message.findMany({
    where: { toUserId: adminUserId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Attach sender info
  const withSenders = await Promise.all(
    messages.map(async (msg) => {
      const sender = await prisma.user.findUnique({
        where: { id: msg.fromUserId },
        select: { name: true, role: true },
      });
      return { ...msg, senderName: sender?.name ?? "Unknown", senderRole: sender?.role ?? "unknown" };
    })
  );
  return withSenders;
}

export async function markMessageRead(messageId: string) {
  await prisma.message.update({ where: { id: messageId }, data: { isRead: true } });
}

export async function markAllRead(userId: string) {
  await prisma.message.updateMany({ where: { toUserId: userId, isRead: false }, data: { isRead: true } });
}

export async function getUnreadCount(userId: string) {
  return prisma.message.count({ where: { toUserId: userId, isRead: false } });
}

export async function getAdminUserId() {
  const admin = await prisma.user.findFirst({ where: { role: "admin" }, select: { id: true } });
  return admin?.id ?? null;
}

export async function getDoctors() {
  return prisma.doctor.findMany({
    include: { user: { select: { id: true, username: true, isActive: true } } },
    where: { isActive: true },
    orderBy: { nameAr: "asc" },
  });
}
