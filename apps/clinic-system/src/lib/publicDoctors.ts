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

  const doctors = await prisma.doctor.findMany({
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
  const priority = await getPriorityDoctorIds(doctors.map((doctor) => doctor.id));
  return sortByPriority(doctors, priority);
}

export async function getPriorityDoctorIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const subs = await prisma.doctorSubscription.findMany({
    where: { doctorId: { in: ids }, expiresAt: { gt: new Date() } },
    select: { doctorId: true },
  });
  return new Set(subs.map((sub) => sub.doctorId));
}

export function sortByPriority<T extends { id: string; nameAr: string }>(rows: T[], priority: Set<string>): T[] {
  return [...rows].sort((a, b) => {
    const rank = Number(priority.has(b.id)) - Number(priority.has(a.id));
    if (rank !== 0) return rank;
    return a.nameAr.localeCompare(b.nameAr, "ar");
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
