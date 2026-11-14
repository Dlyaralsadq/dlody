import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, notFound, ok } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getMobileSession(req);
  if (!session || session.role !== "patient") return unauthorized();

  try {
    const { id: doctorId } = await params;

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) return notFound("Doctor not found");

    const patientId = session.userId;

    const existing = await prisma.doctorFollow.findUnique({
      where: { patientId_doctorId: { patientId, doctorId } },
    });

    if (existing) {
      await prisma.doctorFollow.delete({ where: { id: existing.id } });
      return ok({ following: false });
    }

    await prisma.doctorFollow.create({ data: { patientId, doctorId } });
    return ok({ following: true });
  } catch (err) {
    console.error("[mobile/patient/doctor/[id]/follow POST]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
