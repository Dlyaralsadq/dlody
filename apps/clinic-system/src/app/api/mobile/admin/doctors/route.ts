import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, ok } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || session.role !== "admin") return unauthorized();

  const doctors = await prisma.doctor.findMany({
    include: {
      specialty: { select: { nameAr: true } },
      _count: { select: { patients: true, appointments: true } },
    },
    orderBy: { nameAr: "asc" },
  });

  return ok({ doctors });
}
