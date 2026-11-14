"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertClinicAccess } from "@/lib/clinicAccess";

async function ownsPatient(doctorId: string, patientId: string) {
  return prisma.patient.findFirst({
    where: { id: patientId, doctorId },
    select: { id: true },
  });
}

export async function getPatientChart(doctorId: string, patientId: string) {
  if (!(await assertClinicAccess(doctorId))) return null;
  if (!(await ownsPatient(doctorId, patientId))) return null;

  const [notes, diagnoses, documents] = await Promise.all([
    prisma.clinicalNote.findMany({
      where: { doctorId, patientId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.patientDiagnosis.findMany({
      where: { doctorId, patientId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.patientDocument.findMany({
      where: { doctorId, patientId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  return { notes, diagnoses, documents };
}

export async function addClinicalNote(doctorId: string, patientId: string, body: string) {
  if (!(await assertClinicAccess(doctorId))) return { success: false as const, error: "unauthorized" };
  if (!(await ownsPatient(doctorId, patientId))) return { success: false as const, error: "not_found" };
  const text = body.trim();
  if (text.length < 2 || text.length > 4000) return { success: false as const, error: "invalid" };

  await prisma.clinicalNote.create({ data: { doctorId, patientId, body: text } });
  revalidatePath("/[locale]/doctor/patients", "page");
  return { success: true as const };
}

export async function addPatientDiagnosis(doctorId: string, patientId: string, title: string) {
  if (!(await assertClinicAccess(doctorId))) return { success: false as const, error: "unauthorized" };
  if (!(await ownsPatient(doctorId, patientId))) return { success: false as const, error: "not_found" };
  const text = title.trim();
  if (text.length < 2 || text.length > 200) return { success: false as const, error: "invalid" };

  await prisma.patientDiagnosis.create({ data: { doctorId, patientId, title: text, status: "active" } });
  revalidatePath("/[locale]/doctor/patients", "page");
  return { success: true as const };
}

export async function setDiagnosisStatus(doctorId: string, diagnosisId: string, status: "active" | "resolved") {
  if (!(await assertClinicAccess(doctorId))) return { success: false as const, error: "unauthorized" };
  const row = await prisma.patientDiagnosis.findFirst({ where: { id: diagnosisId, doctorId } });
  if (!row) return { success: false as const, error: "not_found" };
  await prisma.patientDiagnosis.update({ where: { id: diagnosisId }, data: { status } });
  return { success: true as const };
}
