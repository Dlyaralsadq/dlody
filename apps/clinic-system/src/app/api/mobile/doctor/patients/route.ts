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
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = 30;

  const where = {
    doctorId: doctor.id,
    isActive: true,
    ...(search
      ? {
          OR: [
            { name:          { contains: search } },
            { nameAr:        { contains: search } },
            { phone:         { contains: search } },
            { patientNumber: { contains: search } },
          ],
        }
      : {}),
  };

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      select: {
        id: true, patientNumber: true, name: true, nameAr: true,
        phone: true, gender: true, dateOfBirth: true, bloodType: true,
        isActive: true, isRecurring: true, treatmentType: true, createdAt: true,
        _count: { select: { appointments: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.patient.count({ where }),
  ]);

  return ok({
    patients: patients.map((p) => ({
      ...p,
      appointmentCount: p._count.appointments,
    })),
    total,
  });
}
