import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, ok, notFound } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getMobileSession(req);
  if (!session || session.role !== "patient") return unauthorized();

  const { id: appointmentId } = await params;
  if (!appointmentId) return notFound("Appointment not found");

  // Find the patient user record
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, phone: true },
  });
  if (!user) return unauthorized();

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: { select: { email: true, phone: true } } },
  });

  if (!appointment || appointment.deletedAt) return notFound("Appointment not found");

  // Verify ownership
  const ownsIt =
    (user.email && appointment.patient?.email === user.email) ||
    (user.phone && appointment.patient?.phone === user.phone);
  if (!ownsIt) return unauthorized("Not your appointment");

  if (appointment.status === "cancelled") {
    return ok({ success: true, message: "already_cancelled" });
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "cancelled" },
  });

  return ok({ success: true });
}
