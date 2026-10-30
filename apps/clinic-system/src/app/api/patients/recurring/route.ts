import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { patientId, ...data } = body;

  if (!patientId) return NextResponse.json({ error: "Missing patientId" }, { status: 400 });

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      treatmentType: data.treatmentType,
      totalSessions: data.totalSessions ? parseInt(data.totalSessions) : undefined,
      sessionsCompleted: data.sessionsCompleted !== undefined ? parseInt(data.sessionsCompleted) : undefined,
      recurringWeeks: data.recurringWeeks ? parseInt(data.recurringWeeks) : undefined,
      nextVisitDate: data.nextVisitDate ? new Date(data.nextVisitDate) : undefined,
    },
  });

  return NextResponse.json({ success: true });
}
