"use server";

import { prisma } from "@/lib/prisma";
import { normalizeAccountEmail } from "@/lib/realEmail";
import { revalidatePath } from "next/cache";
import { generateId } from "@/lib/utils";

export async function getDoctors(search?: string, specialtyId?: string) {
  const where: Record<string, unknown> = {};

  if (specialtyId) where.specialtyId = specialtyId;

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { nameAr: { contains: search } },
      { specialty: { name: { contains: search } } },
    ];
  }

  return prisma.doctor.findMany({
    where,
    include: {
      specialty: true,
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDoctor(id: string) {
  return prisma.doctor.findUnique({
    where: { id },
    include: {
      specialty: true,
      appointments: {
        include: { patient: true },
        orderBy: { date: "desc" },
        take: 10,
      },
    },
  });
}

export async function createDoctor(data: {
  name: string;
  nameAr: string;
  email?: string;
  phone?: string;
  specialtyId: string;
  licenseNumber?: string;
  qualification?: string;
  qualificationAr?: string;
  experienceYears?: number;
  consultationFee?: number;
  workingDays?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  bio?: string;
  bioAr?: string;
}) {
  const checkedEmail = await normalizeAccountEmail(data.email);
  if (checkedEmail.status === "error") return { success: false, error: checkedEmail.error };
  await prisma.doctor.create({ data: { ...data, email: checkedEmail.status === "ok" ? checkedEmail.email : undefined } });
  revalidatePath("/[locale]/doctors", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { success: true };
}

export async function updateDoctor(id: string, data: Partial<{
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  specialtyId: string;
  licenseNumber: string;
  qualification: string;
  qualificationAr: string;
  experienceYears: number;
  consultationFee: number;
  workingDays: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  bio: string;
  bioAr: string;
  isActive: boolean;
}>) {
  const next = { ...data };
  if (next.email !== undefined) {
    const checkedEmail = await normalizeAccountEmail(next.email);
    if (checkedEmail.status === "error") return { success: false, error: checkedEmail.error };
    next.email = checkedEmail.status === "ok" ? checkedEmail.email : undefined;
  }
  await prisma.doctor.update({ where: { id }, data: next });
  revalidatePath("/[locale]/doctors", "page");
  return { success: true };
}

export async function deleteDoctor(id: string) {
  await prisma.doctor.delete({ where: { id } });
  revalidatePath("/[locale]/doctors", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { success: true };
}

export async function getSpecialties() {
  return prisma.specialty.findMany({
    include: { _count: { select: { doctors: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createSpecialty(data: {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
}) {
  await prisma.specialty.create({ data });
  revalidatePath("/[locale]/specialties", "page");
  return { success: true };
}

export async function updateSpecialty(id: string, data: Partial<{
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
}>) {
  await prisma.specialty.update({ where: { id }, data });
  revalidatePath("/[locale]/specialties", "page");
  return { success: true };
}

export async function deleteSpecialty(id: string) {
  await prisma.specialty.delete({ where: { id } });
  revalidatePath("/[locale]/specialties", "page");
  return { success: true };
}
