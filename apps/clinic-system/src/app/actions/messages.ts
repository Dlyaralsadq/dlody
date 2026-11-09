"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAppSession } from "@/lib/auth";

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

/** Full two-way support thread between doctor and admin (excludes system notifications) */
export async function getSupportConversation(userId: string, adminUserId: string) {
  const msgs = await prisma.message.findMany({
    where: {
      OR: [
        { fromUserId: userId, toUserId: adminUserId },
        { fromUserId: adminUserId, toUserId: userId },
      ],
      NOT: { fromUserId: "system" }, // system notifications are one-way (shown separately)
    },
    orderBy: { createdAt: "asc" },
  });
  return msgs;
}

/** Admin: get all support conversations grouped by doctor (excludes system broadcasts) */
export async function getAllSupportConversations(adminUserId: string) {
  const msgs = await prisma.message.findMany({
    where: {
      OR: [
        { toUserId: adminUserId },
        { fromUserId: adminUserId },
      ],
      NOT: { fromUserId: "system" }, // exclude system notifications
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by the "other" user (the doctor)
  const threads = new Map<string, typeof msgs>();
  for (const m of msgs) {
    const otherId = m.fromUserId === adminUserId ? m.toUserId : m.fromUserId;
    if (!threads.has(otherId)) threads.set(otherId, []);
    threads.get(otherId)!.push(m);
  }

  // Attach doctor/user name
  const result = await Promise.all(
    Array.from(threads.entries()).map(async ([otherId, messages]) => {
      const user = await prisma.user.findUnique({
        where: { id: otherId },
        select: { name: true, role: true, doctor: { select: { nameAr: true, specialty: { select: { nameAr: true } } } } },
      });
      const unread = messages.filter(m => m.toUserId === adminUserId && !m.isRead).length;
      return { userId: otherId, name: user?.name ?? "Unknown", nameAr: user?.doctor?.nameAr, specialty: user?.doctor?.specialty?.nameAr, messages, unread, lastMessage: messages[0] };
    })
  );

  return result.sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
}

/**
 * Send a one-way system notification.
 * toUserId = specific user ID, or null = broadcast to ALL active doctors.
 * fromUserId is stored as "system" so the doctor cannot reply.
 */
export async function sendSystemNotification(
  toUserId: string | null,
  content: string
): Promise<{ success: boolean; sent: number }> {
  const session = await getAppSession();
  if (!session || session.role !== "admin") return { success: false, sent: 0 };

  if (toUserId) {
    // Single doctor
    await prisma.message.create({
      data: { fromUserId: "system", toUserId, content },
    });
    revalidatePath("/[locale]/doctor", "layout");
    return { success: true, sent: 1 };
  }

  // Broadcast: send to every doctor who has a user account
  const doctors = await prisma.doctor.findMany({
    where: { isActive: true, userId: { not: null } },
    select: { userId: true },
  });

  await prisma.message.createMany({
    data: doctors.map(d => ({ fromUserId: "system", toUserId: d.userId!, content })),
  });

  revalidatePath("/[locale]/doctor", "layout");
  return { success: true, sent: doctors.length };
}

/** Get all system notifications sent (for admin history view) */
export async function getSystemNotifications() {
  return prisma.message.findMany({
    where: { fromUserId: "system" },
    orderBy: { createdAt: "desc" },
    take: 100,
    distinct: ["content", "createdAt"], // avoid showing per-doctor duplicates
  });
}

/** Count unique broadcasts (by content+createdAt approximation) */
export async function getSystemNotificationStats() {
  const all = await prisma.message.findMany({
    where: { fromUserId: "system" },
    select: { content: true, createdAt: true, toUserId: true },
    orderBy: { createdAt: "desc" },
  });

  // Group by approximate timestamp (same second = same broadcast)
  const groups = new Map<string, { content: string; createdAt: Date; recipients: number }>();
  for (const m of all) {
    const key = `${Math.floor(new Date(m.createdAt).getTime() / 2000)}`; // 2s window
    if (!groups.has(key)) {
      groups.set(key, { content: m.content, createdAt: new Date(m.createdAt), recipients: 0 });
    }
    groups.get(key)!.recipients++;
  }

  return Array.from(groups.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
