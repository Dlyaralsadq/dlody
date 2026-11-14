import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, notFound, forbidden, ok } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getMobileSession(req);
  if (!session || (session.role !== "doctor" && session.role !== "secretary")) {
    return unauthorized();
  }

  try {
    const { id: appointmentId } = await params;

    const doctor = await prisma.doctor.findFirst({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!doctor) return Response.json({ error: "doctor_not_found" }, { status: 404 });

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment || appointment.deletedAt) return notFound("Appointment not found");
    if (appointment.doctorId !== doctor.id) return forbidden();

    const body = await req.json();
    const { status, arrivalStatus, notes, diagnosis, prescription } = body ?? {};

    const data: Record<string, unknown> = {};
    if (status !== undefined)        data.status = status;
    if (arrivalStatus !== undefined) data.arrivalStatus = arrivalStatus;
    if (notes !== undefined)         data.notes = notes;
    if (diagnosis !== undefined)     data.diagnosis = diagnosis;
    if (prescription !== undefined)  data.prescription = prescription;

    if (status === "completed" && !appointment.completedAt) {
      data.completedAt = new Date();
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data,
      include: {
        patient: {
          select: { id: true, name: true, nameAr: true, phone: true },
        },
      },
    });

    return ok(updated);
  } catch (err) {
    console.error("[mobile/doctor/appointments/[id] PATCH]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getMobileSession(req);
  if (!session || (session.role !== "doctor" && session.role !== "secretary")) {
    return unauthorized();
  }

  try {
    const { id: appointmentId } = await params;

    const doctor = await prisma.doctor.findFirst({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!doctor) return Response.json({ error: "doctor_not_found" }, { status: 404 });

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment || appointment.deletedAt) return notFound("Appointment not found");
    if (appointment.doctorId !== doctor.id) return forbidden();

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        deletedAt: new Date(),
        deletedBy: session.userId,
        deletedByRole: session.role,
      },
    });

    return ok({ success: true });
  } catch (err) {
    console.error("[mobile/doctor/appointments/[id] DELETE]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
