"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateId } from "@/lib/utils";

export async function getPatients(search?: string) {
  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { nameAr: { contains: search } },
          { patientNumber: { contains: search } },
          { phone: { contains: search } },
        ],
      }
    : {};

  return prisma.patient.findMany({
    where,
    include: {
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPatient(id: string) {
  return prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        include: { doctor: { include: { specialty: true } } },
        orderBy: { date: "desc" },
        take: 10,
      },
    },
  });
}

export async function createPatient(data: {
  name: string;
  nameAr?: string;
  dateOfBirth?: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  nationalId?: string;
  bloodType?: string;
  insurance?: string;
  medicalHistory?: string;
  allergies?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}) {
  const patientNumber = generateId("P");

  await prisma.patient.create({
    data: {
      ...data,
      patientNumber,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
    },
  });

  revalidatePath("/[locale]/patients", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { success: true };
}

export async function updatePatient(id: string, data: {
  name?: string;
  nameAr?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  nationalId?: string;
  bloodType?: string;
  insurance?: string;
  medicalHistory?: string;
  allergies?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}) {
  await prisma.patient.update({
    where: { id },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    },
  });

  revalidatePath("/[locale]/patients", "page");
  return { success: true };
}

export async function deletePatient(id: string) {
  await prisma.patient.delete({ where: { id } });
  revalidatePath("/[locale]/patients", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { success: true };
}
