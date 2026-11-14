import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, ok } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";
import { updateDoctorSettings } from "@/app/actions/doctorPortal";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || session.role !== "doctor") return unauthorized();

  const doctor = await prisma.doctor.findFirst({
    where: { userId: session.userId },
    include: {
      specialty: { select: { id: true, name: true, nameAr: true } },
    },
  });
  if (!doctor) return Response.json({ error: "not_found" }, { status: 404 });

  return ok(doctor);
}

export async function PATCH(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || session.role !== "doctor") return unauthorized();

  try {
    const body = await req.json();
    const result = await updateDoctorSettings(session.userId, body);
    if (!result.success) {
      return Response.json({ error: (result as Record<string, unknown>).error ?? "failed" }, { status: 422 });
    }
    return ok({ success: true });
  } catch (err) {
    console.error("[mobile/doctor/settings PATCH]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
