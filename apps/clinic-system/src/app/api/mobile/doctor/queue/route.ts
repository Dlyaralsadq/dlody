import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, ok } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || (session.role !== "doctor" && session.role !== "secretary")) {
    return unauthorized();
  }

  try {
    const doctor = await prisma.doctor.findFirst({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!doctor) return Response.json({ error: "doctor_not_found" }, { status: 404 });

    const now = new Date();
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
    );
    const endOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
    );

    const dateParam = req.nextUrl.searchParams.get("date");
    let rangeStart = startOfDay;
    let rangeEnd = endOfDay;
    if (dateParam) {
      rangeStart = new Date(`${dateParam}T00:00:00Z`);
      rangeEnd = new Date(`${dateParam}T23:59:59.999Z`);
    }

    const queue = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        date: { gte: rangeStart, lte: rangeEnd },
        deletedAt: null,
      },
      include: {
        patient: {
          select: { id: true, name: true, nameAr: true, phone: true },
        },
      },
      orderBy: [{ queueNumber: "asc" }, { date: "asc" }],
    });

    const dateStr = dateParam ?? now.toISOString().slice(0, 10);

    return ok({
      queue: queue.map((a) => ({
        id: a.id,
        appointmentNumber: a.appointmentNumber,
        date: a.date,
        queueNumber: a.queueNumber,
        status: a.status,
        arrivalStatus: a.arrivalStatus,
        reason: a.reason,
        patient: a.patient,
      })),
      date: dateStr,
    });
  } catch (err) {
    console.error("[mobile/doctor/queue GET]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
