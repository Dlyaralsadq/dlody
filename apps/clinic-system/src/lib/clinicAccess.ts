import { getAppSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Doctor account or the secretary linked to that clinic. */
export async function assertClinicAccess(doctorId: string): Promise<{ userId: string; role: string } | null> {
  const session = await getAppSession();
  if (!session) return null;

  if (session.role === "doctor") {
    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, userId: session.userId },
      select: { id: true },
    });
    return doctor ? { userId: session.userId, role: session.role } : null;
  }

  if (session.role === "secretary") {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { linkedDoctorId: true },
    });
    return user?.linkedDoctorId === doctorId ? { userId: session.userId, role: session.role } : null;
  }

  return null;
}

export async function clinicDoctorIdForSession(): Promise<string | null> {
  const session = await getAppSession();
  if (!session) return null;
  if (session.role === "doctor") {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    return doctor?.id ?? null;
  }
  if (session.role === "secretary") {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { linkedDoctorId: true },
    });
    return user?.linkedDoctorId ?? null;
  }
  return null;
}
