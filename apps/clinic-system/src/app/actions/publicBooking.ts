"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { calcAge } from "@/lib/requirePatient";

function generatePatientNumber(): string {
  return `ONL-${Date.now().toString().slice(-6)}`;
}

function generateAppointmentNumber(): string {
  return `APT-ONL-${Date.now().toString().slice(-7)}`;
}

export async function createOnlineBooking(data: {
  doctorId: string;
  patientName: string;
  patientNameAr: string;
  phone: string;
  date: string;
  time: string;
  reason: string;
  locale: string;
  bookingForSelf?: boolean;
  patientAge?: number | null;
  patientGender?: string | null;
  patientBloodType?: string | null;
}): Promise<{ success: boolean; error?: string; appointmentNumber?: string }> {
  const session = await getSession();
  if (!session || session.role !== "patient") {
    return { success: false, error: "login_required" };
  }

  const bookingForSelf = data.bookingForSelf !== false;
  const accountUser = await prisma.user.findUnique({ where: { id: session.userId } });

  let phone: string;
  let patientName: string;
  let patientNameAr: string;
  let patientAge: number | null;
  let patientGender: string | null;
  let patientBloodType: string | null;
  let bookedForName: string;

  if (bookingForSelf && accountUser) {
    phone = accountUser.username;
    patientName = accountUser.name;
    patientNameAr = accountUser.name;
    patientAge = calcAge(accountUser.dateOfBirth);
    patientGender = accountUser.gender ?? null;
    patientBloodType = accountUser.bloodType ?? null;
    bookedForName = accountUser.name;
  } else {
    phone = data.phone.replace(/\D/g, "");
    patientName = data.patientName || data.patientNameAr;
    patientNameAr = data.patientNameAr || data.patientName;
    patientAge = data.patientAge ?? null;
    patientGender = data.patientGender ?? null;
    patientBloodType = data.patientBloodType ?? null;
    bookedForName = patientName;
  }

  const doctor = await prisma.doctor.findFirst({
    where: { id: data.doctorId, isActive: true },
  });
  if (!doctor) return { success: false, error: "doctor_unavailable" };

  const [year, month, day] = data.date.split("-").map(Number);
  const [hour, minute] = data.time.split(":").map(Number);
  const appointmentDate = new Date(year, month - 1, day, hour, minute);

  if (isNaN(appointmentDate.getTime()) || appointmentDate < new Date()) {
    return { success: false, error: "invalid_date" };
  }

  const windowStart = new Date(appointmentDate.getTime() - 15 * 60 * 1000);
  const windowEnd = new Date(appointmentDate.getTime() + 15 * 60 * 1000);

  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId: data.doctorId,
      status: { notIn: ["cancelled", "deleted"] },
      date: { gte: windowStart, lte: windowEnd },
    },
  });

  if (conflict) return { success: false, error: "slot_taken" };

  let patient = await prisma.patient.findFirst({
    where: { phone, doctorId: data.doctorId },
  });

  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        patientNumber: generatePatientNumber(),
        name: patientName,
        nameAr: patientNameAr,
        gender: patientGender ?? "unknown",
        phone,
        bloodType: patientBloodType,
        dateOfBirth: patientAge != null
          ? new Date(new Date().getFullYear() - patientAge, 0, 1)
          : null,
        doctorId: data.doctorId,
      },
    });
  } else if (patientGender || patientBloodType) {
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        gender: patientGender ?? patient.gender,
        bloodType: patientBloodType ?? patient.bloodType,
      },
    });
  }

  const notesParts: string[] = [];
  if (patientAge != null) notesParts.push(`العمر: ${patientAge}`);
  if (patientGender) notesParts.push(`الجنس: ${patientGender}`);
  if (patientBloodType) notesParts.push(`فصيلة الدم: ${patientBloodType}`);
  if (!bookingForSelf) notesParts.push(`حجز لشخص آخر: ${bookedForName}`);

  const aptNum = generateAppointmentNumber();
  await prisma.appointment.create({
    data: {
      appointmentNumber: aptNum,
      patientId: patient.id,
      doctorId: data.doctorId,
      date: appointmentDate,
      duration: 30,
      type: "consultation",
      status: "scheduled",
      arrivalStatus: "pending",
      reason: data.reason,
      notes: notesParts.length ? notesParts.join(" · ") : null,
      source: "online",
      patientPhone: phone,
      patientAge,
      patientGender,
      patientBloodType,
      bookedForName,
      bookingForSelf,
    },
  });

  revalidatePath(`/[locale]/patient/account`, "page");
  revalidatePath(`/[locale]/secretary`);
  revalidatePath(`/[locale]/doctor`);

  return { success: true, appointmentNumber: aptNum };
}
