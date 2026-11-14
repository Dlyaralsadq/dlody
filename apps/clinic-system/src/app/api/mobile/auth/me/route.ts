import type { NextRequest } from "next/server";
import { getMobileSession, ok, unauthorized } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true, username: true, name: true, role: true, isActive: true,
      email: true, phone: true, avatarUrl: true, linkedDoctorId: true,
    },
  });
  if (!user) return unauthorized("User not found");

  let linkedDoctorId = user.linkedDoctorId;
  if (user.role === "doctor" && !linkedDoctorId) {
    const doctor = await prisma.doctor.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });
    linkedDoctorId = doctor?.id ?? null;
  }

  return ok({ ...user, linkedDoctorId });
}
