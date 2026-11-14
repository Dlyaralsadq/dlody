import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, ok } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || session.role !== "admin") return unauthorized();

  const { searchParams } = req.nextUrl;
  const search   = searchParams.get("search") ?? "";
  const page     = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = 50;

  const where = search
    ? {
        OR: [
          { name:          { contains: search } },
          { phone:         { contains: search } },
          { patientNumber: { contains: search } },
        ],
      }
    : {};

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      include: {
        doctor: { select: { nameAr: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.patient.count({ where }),
  ]);

  return ok({ patients, total });
}
