import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAppSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const session = await getAppSession();
  if (!session || session.role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { doctorId, ...updateData } = body;

  if (!doctorId) {
    return NextResponse.json({ error: "Missing doctorId" }, { status: 400 });
  }

  // Ensure doctor belongs to this user
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, userId: session.userId },
  });
  if (!doctor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Whitelist allowed fields
  const allowed: Record<string, unknown> = {};
  const fields = [
    "name", "nameAr", "bio", "bioAr",
    "specialtyId", "phone", "email",
    "licenseNumber", "qualification", "qualificationAr",
    "experienceYears", "consultationFee",
    "workingDays", "workingHoursStart", "workingHoursEnd", "appointmentDuration",
    "clinicAddress", "clinicLat", "clinicLng",
    "logoUrl", "showConsultationFee", "recurringPatientsEnabled",
  ];
  for (const f of fields) {
    if (updateData[f] !== undefined) allowed[f] = updateData[f];
  }

  await prisma.doctor.update({
    where: { id: doctorId },
    data: allowed,
  });

  revalidatePath("/[locale]/doctor/settings", "page");
  revalidatePath("/[locale]/patient", "page");
  revalidatePath("/[locale]/patient/doctor/[id]", "page");

  return NextResponse.json({ success: true });
}
