import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, ok } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || (session.role !== "doctor" && session.role !== "secretary")) {
    return unauthorized();
  }

  const doctor = await prisma.doctor.findFirst({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!doctor) return Response.json({ error: "not_found" }, { status: 404 });

  const { searchParams } = req.nextUrl;
  const dateParam = searchParams.get("date");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = 50;

  let dateFilter = {};
  if (dateParam) {
    const start = new Date(`${dateParam}T00:00:00`);
    const end   = new Date(`${dateParam}T23:59:59`);
    dateFilter = { date: { gte: start, lte: end } };
  }

  const where = {
    doctorId: doctor.id,
    deletedAt: null,
    ...(status ? { status } : {}),
    ...dateFilter,
  };

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true, name: true, nameAr: true, phone: true,
            gender: true, dateOfBirth: true, bloodType: true, patientNumber: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { queueNumber: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.appointment.count({ where }),
  ]);

  return ok({ appointments, total });
}
