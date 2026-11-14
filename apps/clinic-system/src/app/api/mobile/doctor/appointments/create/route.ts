import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, badRequest, ok } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function POST(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || (session.role !== "doctor" && session.role !== "secretary")) {
    return unauthorized();
  }

  try {
    const doctor = await prisma.doctor.findFirst({
      where: { userId: session.userId },
      select: { id: true, appointmentDuration: true },
    });
    if (!doctor) return Response.json({ error: "doctor_not_found" }, { status: 404 });

    const body = await req.json();
    const { patientName, patientPhone, date, time, reason, duration, type } = body ?? {};

    if (!patientName?.trim())  return badRequest("patientName is required");
    if (!patientPhone?.trim()) return badRequest("patientPhone is required");
    if (!date)                 return badRequest("date is required");

    // Build appointment datetime
    const appointmentDate = time
      ? new Date(`${date}T${time}`)
      : new Date(`${date}T09:00:00`);

    if (isNaN(appointmentDate.getTime())) {
      return badRequest("Invalid date/time format");
    }

    // Find or create patient by phone
    let patient = await prisma.patient.findFirst({
      where: { phone: patientPhone.trim(), doctorId: doctor.id },
      select: { id: true, patientNumber: true },
    });

    if (!patient) {
      const patientNumber = generateId("P");
      patient = await prisma.patient.create({
        data: {
          patientNumber,
          name: patientName.trim(),
          nameAr: patientName.trim(),
          phone: patientPhone.trim(),
          gender: "unknown",
          doctorId: doctor.id,
        },
        select: { id: true, patientNumber: true },
      });
    }

    // Count today's appointments to get queue number
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const todayCount = await prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        date: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
    });

    const appointmentNumber = generateId("A");

    const appointment = await prisma.appointment.create({
      data: {
        appointmentNumber,
        patientId: patient.id,
        doctorId: doctor.id,
        date: appointmentDate,
        duration: duration ?? doctor.appointmentDuration,
        type: type ?? "consultation",
        status: "scheduled",
        arrivalStatus: "pending",
        queueNumber: todayCount + 1,
        reason: reason ?? null,
        source: "manual",
        patientPhone: patientPhone.trim(),
      },
    });

    return ok(
      {
        success: true,
        appointmentId: appointment.id,
        appointmentNumber: appointment.appointmentNumber,
      },
      201
    );
  } catch (err) {
    console.error("[mobile/doctor/appointments/create POST]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
