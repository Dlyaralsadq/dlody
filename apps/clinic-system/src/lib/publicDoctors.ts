import { prisma } from "@/lib/prisma";
import { IRAQ_GOVERNORATES } from "@/lib/iraq";

export async function getPublicSpecialties() {
  return prisma.specialty.findMany({
    where: { isActive: true },
    orderBy: { nameAr: "asc" },
  });
}

/**
 * Returns ALL active doctors for the patient map.
 * Subscription is only required for clinic management access, not for map visibility.
 */
export async function getListedDoctors(filters?: {
  specialtyId?: string;
  governorate?: string;
  district?: string;
  query?: string;
}) {
  // Build location filter
  let addressFilter: { clinicAddress: { contains: string } } | undefined;
  if (filters?.district && filters?.governorate) {
    const gov = IRAQ_GOVERNORATES.find((g) => g.id === filters.governorate);
    const d = gov?.districts.find((d) => d.id === filters.district);
    if (d) addressFilter = { clinicAddress: { contains: d.ar } };
  } else if (filters?.governorate) {
    const gov = IRAQ_GOVERNORATES.find((g) => g.id === filters.governorate);
    if (gov) addressFilter = { clinicAddress: { contains: gov.ar } };
  }

  return prisma.doctor.findMany({
    where: {
      isActive: true,
      ...(filters?.specialtyId ? { specialtyId: filters.specialtyId } : {}),
      ...(addressFilter ?? {}),
      ...(filters?.query
        ? {
            OR: [
              { name:          { contains: filters.query } },
              { nameAr:        { contains: filters.query } },
              { clinicAddress: { contains: filters.query } },
            ],
          }
        : {}),
    },
    include: { specialty: true },
    orderBy: { nameAr: "asc" },
  });
}

export async function getPublicDoctorById(id: string) {
  return prisma.doctor.findFirst({
    where: { id, isActive: true },
    include: { specialty: true },
  });
}

/**
 * Checks whether a doctor has an active paid subscription.
 * Used to gate clinic management features.
 */
export async function hasActiveSubscription(doctorId: string): Promise<boolean> {
  const sub = await prisma.doctorSubscription.findFirst({
    where: { doctorId, expiresAt: { gt: new Date() } },
  });
  return !!sub;
}
