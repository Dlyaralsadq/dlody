import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, ok } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";
import { getTodaySyncedQueue } from "@/app/actions/clinic";
import { hasActiveSubscription } from "@/lib/publicDoctors";
import { getUnreadCount, getAdminUserId } from "@/app/actions/messages";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || (session.role !== "doctor" && session.role !== "secretary")) {
    return unauthorized();
  }

  const doctor = await prisma.doctor.findFirst({
    where: { userId: session.userId },
    include: { specialty: { select: { name: true, nameAr: true } } },
  });
  if (!doctor) return Response.json({ error: "doctor_not_found" }, { status: 404 });

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [
    todayAppointments,
    totalPatients,
    queue,
    subscriptionActive,
    unreadCount,
    adminUserId,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        date: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
      select: { status: true, arrivalStatus: true },
    }),
    prisma.patient.count({ where: { doctorId: doctor.id, isActive: true } }),
    getTodaySyncedQueue(doctor.id),
    hasActiveSubscription(doctor.id),
    getUnreadCount(session.userId),
    getAdminUserId(),
  ]);

  const sub = await prisma.doctorSubscription.findFirst({
    where: { doctorId: doctor.id },
    select: { expiresAt: true },
  });

  return ok({
    doctor: {
      id:               doctor.id,
      name:             doctor.name,
      nameAr:           doctor.nameAr,
      specialty:        doctor.specialty,
      logoUrl:          doctor.logoUrl,
      clinicAddress:    doctor.clinicAddress,
      workingHoursStart: doctor.workingHoursStart,
      workingHoursEnd:  doctor.workingHoursEnd,
    },
    stats: {
      todayTotal:     todayAppointments.length,
      todayCompleted: todayAppointments.filter((a) => a.status === "completed").length,
      todayWaiting:   todayAppointments.filter((a) => a.arrivalStatus === "arrived" && a.status === "scheduled").length,
      weekTotal:      0, // computed below if needed
      totalPatients,
      unreadMessages: unreadCount,
    },
    queue,
    subscription: {
      active:    subscriptionActive,
      expiresAt: sub?.expiresAt?.toISOString() ?? null,
    },
  });
}
