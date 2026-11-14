import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, badRequest, notFound, ok } from "@/lib/mobileAuth";
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

    const body = await req.json();
    const score = Number(body?.score);
    if (!score || score < 1 || score > 5 || !Number.isInteger(score)) {
      return badRequest("score must be an integer between 1 and 5");
    }

    const patientId = session.userId;

    await prisma.doctorRating.upsert({
      where: { patientId_doctorId: { patientId, doctorId } },
      update: { score },
      create: { patientId, doctorId, score },
    });

    const agg = await prisma.doctorRating.aggregate({
      where: { doctorId },
      _avg: { score: true },
      _count: { id: true },
    });

    return ok({
      success: true,
      avg: agg._avg.score ?? 0,
      count: agg._count.id,
    });
  } catch (err) {
    console.error("[mobile/patient/doctor/[id]/rate POST]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
