"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const REPEAT_WINDOW_MS = 30 * 60 * 1000;

/** A new platform visit is stored when the same patient has been away for 30 minutes. */
export async function recordPlatformVisit(userId: string) {
  try {
    const since = new Date(Date.now() - REPEAT_WINDOW_MS);
    const recent = await prisma.platformVisit.findFirst({
      where: { userId, createdAt: { gte: since } },
      select: { id: true },
    });
    if (recent) return;
    await prisma.platformVisit.create({ data: { userId } });
  } catch {
    // The visit tables are created on the next database update.
  }
}

/** kind "profile" is the doctor profile. kind "clinic" is the clinic info page. */
export async function recordDoctorPageView(doctorId: string, kind: "profile" | "clinic") {
  try {
    const session = await getSession();
    if (!session || session.role !== "patient") return;
    const since = new Date(Date.now() - REPEAT_WINDOW_MS);
    const recent = await prisma.doctorPageView.findFirst({
      where: {
        doctorId,
        viewerId: session.userId,
        kind,
        createdAt: { gte: since },
      },
      select: { id: true },
    });
    if (recent) return;
    await prisma.doctorPageView.create({
      data: { doctorId, viewerId: session.userId, kind },
    });
  } catch {
    // The visit tables are created on the next database update.
  }
}
