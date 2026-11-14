import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, notFound, ok } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getMobileSession(_req);
  if (!session || (session.role !== "doctor" && session.role !== "secretary")) {
    return unauthorized();
  }

  const { id } = await params;

  const doctor = await prisma.doctor.findFirst({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!doctor) return notFound("Doctor not found");

  const patient = await prisma.patient.findFirst({
    where: { id, doctorId: doctor.id },
    include: {
      appointments: {
        where: { deletedAt: null },
        orderBy: { date: "desc" },
        take: 10,
        select: {
          id: true,
          date: true,
          status: true,
          reason: true,
          notes: true,
          diagnosis: true,
          prescription: true,
        },
      },
      clinicalNotes: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, body: true, createdAt: true },
      },
    },
  });

  if (!patient) return notFound("Patient not found");

  return ok({
    ...patient,
    appointmentCount: patient.appointments.length,
  });
}
