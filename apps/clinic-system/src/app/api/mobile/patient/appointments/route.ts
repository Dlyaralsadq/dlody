import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, ok } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || session.role !== "patient") return unauthorized();

  // Find this user's linked patient records (matched by user email/phone)
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, phone: true },
  });

  if (!user) return unauthorized("User not found");

  const orConditions: Record<string, unknown>[] = [];
  if (user.email) orConditions.push({ email: user.email });
  if (user.phone) orConditions.push({ phone: user.phone });
  if (orConditions.length === 0) return ok({ upcoming: [], past: [] });

  const appointments = await prisma.appointment.findMany({
    where: {
      patient: { OR: orConditions as Parameters<typeof prisma.patient.findMany>[0]["where"][] },
      deletedAt: null,
    },
    include: {
      doctor: {
        select: {
          id: true, name: true, nameAr: true, logoUrl: true,
          clinicAddress: true, phone: true,
          specialty: { select: { name: true, nameAr: true } },
        },
      },
    },
    orderBy: { date: "asc" },
  });

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => new Date(a.date) >= now && a.status !== "cancelled" && a.status !== "no_show"
  );
  const past = appointments
    .filter(
      (a) => new Date(a.date) < now || a.status === "completed" || a.status === "cancelled"
    )
    .reverse()
    .slice(0, 50);

  return ok({ upcoming, past });
}
