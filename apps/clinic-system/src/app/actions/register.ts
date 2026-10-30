"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

function generatePatientNumber(): string {
  return `DR-${Date.now().toString().slice(-6)}`;
}

export async function registerDoctor(data: {
  nameAr: string;
  name: string;
  username: string;
  password: string;
  phone: string;
  specialtyId: string;
  clinicAddress?: string;
  clinicLat?: number;
  clinicLng?: number;
  consultationFee?: number;
  workingHoursStart?: string;
  workingHoursEnd?: string;
}): Promise<{ success: boolean; error?: string }> {
  // Check username availability
  const existing = await prisma.user.findUnique({
    where: { username: data.username },
  });
  if (existing) return { success: false, error: "username_taken" };

  // Check specialty exists
  const specialty = await prisma.specialty.findUnique({
    where: { id: data.specialtyId },
  });
  if (!specialty) return { success: false, error: "invalid_specialty" };

  const hashedPwd = await hashPassword(data.password);

  // Create user + doctor in transaction
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: data.username,
        password: hashedPwd,
        name: data.nameAr || data.name,
        role: "doctor",
        isActive: true,
      },
    });

    await tx.doctor.create({
      data: {
        name: data.name || data.nameAr,
        nameAr: data.nameAr,
        phone: data.phone,
        specialtyId: data.specialtyId,
        clinicAddress: data.clinicAddress,
        clinicLat: data.clinicLat,
        clinicLng: data.clinicLng,
        consultationFee: data.consultationFee,
        workingHoursStart: data.workingHoursStart,
        workingHoursEnd: data.workingHoursEnd,
        isActive: true,
        userId: user.id,
      },
    });
  });

  return { success: true };
}
