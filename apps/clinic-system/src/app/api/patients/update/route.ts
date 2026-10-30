import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || !["doctor", "secretary", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { patientId, doctorId, phone, dateOfBirth, gender, bloodType, name, nameAr, address, medicalHistory, allergies } = await request.json();
  if (!patientId) return NextResponse.json({ error: "Missing patientId" }, { status: 400 });

  // Verify the patient belongs to the doctor
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, doctorId },
  });
  if (!patient && session.role !== "admin") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};
  if (phone)       update.phone       = phone;
  if (dateOfBirth) update.dateOfBirth = new Date(dateOfBirth);
  if (gender)      update.gender      = gender;
  if (bloodType)   update.bloodType   = bloodType;
  if (name)        update.name        = name;
  if (nameAr)      update.nameAr      = nameAr;
  if (address)     update.address     = address;
  if (medicalHistory) update.medicalHistory = medicalHistory;
  if (allergies)   update.allergies   = allergies;

  await prisma.patient.update({ where: { id: patientId }, data: update });
  return NextResponse.json({ success: true });
}
