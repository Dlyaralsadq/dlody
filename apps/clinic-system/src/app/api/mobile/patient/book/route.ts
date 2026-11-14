import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, badRequest, ok } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";
import { generateId } from "@/lib/utils";
import { getAppointmentDaySlots } from "@/app/actions/appointmentAvailability";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date");
  if (!doctorId || !date) return badRequest("doctorId and date required");
  const slots = await getAppointmentDaySlots(doctorId, date);
  return ok(slots);
}

export async function POST(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || session.role !== "patient") return unauthorized();

  try {
    const body = await req.json();
    const { doctorId, date, time, reason, patientName, patientPhone } = body;

    if (!doctorId || !date || !time) {
      return badRequest("doctorId, date, and time are required");
    }

    // Combine date + time
    const dateTime = new Date(`${date}T${time}:00`);
    if (isNaN(dateTime.getTime())) return badRequest("invalid date/time");
    if (dateTime < new Date()) return badRequest("date_in_past");

    // Verify doctor is active
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, name: true, isActive: true },
    });
    if (!doctor || !doctor.isActive) {
      return Response.json({ error: "doctor_not_available" }, { status: 422 });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, phone: true, email: true, gender: true, dateOfBirth: true },
    });

    // Find or create patient record for this user at this doctor
    let patient = null;
    if (user?.email) {
      patient = await prisma.patient.findFirst({
        where: { doctorId, email: user.email },
      });
    }
    if (!patient && user?.phone) {
      patient = await prisma.patient.findFirst({
        where: { doctorId, phone: user.phone },
      });
    }

    const bookedName  = (typeof patientName === "string" && patientName.trim()) ? patientName.trim() : (user?.name ?? session.name);
    const bookedPhone = (typeof patientPhone === "string" && patientPhone.trim()) ? patientPhone.trim() : (user?.phone ?? "");

    if (!patient) {
      const patientNumber = `ONL-${Date.now().toString().slice(-6)}`;
      patient = await prisma.patient.create({
        data: {
          id:            generateId("PAT"),
          patientNumber,
          doctorId,
          name:          bookedName,
          nameAr:        bookedName,
          phone:         bookedPhone,
          email:         user?.email ?? null,
          gender:        user?.gender ?? "other",
          dateOfBirth:   user?.dateOfBirth ?? null,
          isActive:      true,
        },
      });
    }

    // Create appointment
    const appointmentNumber = `APT-MOB-${Date.now().toString().slice(-7)}`;
    const appointment = await prisma.appointment.create({
      data: {
        id:                generateId("APT"),
        appointmentNumber,
        doctorId,
        patientId:         patient.id,
        date:              dateTime,
        status:            "scheduled",
        arrivalStatus:     "not_arrived",
        reason:            reason ?? null,
        source:            "online",
        queueNumber:       null,
        patientPhone:      bookedPhone || null,
        bookedForName:     bookedName,
        bookingForSelf:    !patientName,
      },
    });

    return ok({ success: true, appointmentId: appointment.id, appointmentNumber }, 201);
  } catch (err) {
    console.error("[mobile/patient/book]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
