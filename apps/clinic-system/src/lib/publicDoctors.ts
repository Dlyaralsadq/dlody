import { prisma } from "@/lib/prisma";
import { IRAQ_GOVERNORATES } from "@/lib/iraq";
import { unstable_cache } from "next/cache";

// ─── Cache TTLs ────────────────────────────────────────────────────────────────
const TTL_SPECIALTIES = 3600;   // 1 hour  — changes only when admin edits a specialty
const TTL_DOCTORS     = 60;     // 60 s    — updated when any doctor edits their profile
const TTL_DOCTOR_PAGE = 300;    // 5 min   — per-doctor profile page data
const TTL_SUBSCRIPTION = 30;   // 30 s    — subscription status must stay fresh for feature gating

// ─── Specialties ───────────────────────────────────────────────────────────────
export const getPublicSpecialties = unstable_cache(
  async () =>
    prisma.specialty.findMany({
      where: { isActive: true },
      select: { id: true, name: true, nameAr: true, description: true, descriptionAr: true, config: true },
      orderBy: { nameAr: "asc" },
    }),
  ["specialties"],
  { revalidate: TTL_SPECIALTIES, tags: ["specialties"] }
);

// ─── Doctor list (map + explore) ───────────────────────────────────────────────
/**
 * Returns active doctors for the patient map.
 * Result is cached per unique filter combination for 60 s.
 */
export async function getListedDoctors(filters?: {
  specialtyId?: string;
  governorate?: string;
  district?: string;
  query?: string;
}) {
  const sf = filters?.specialtyId ?? "";
  const gf = filters?.governorate ?? "";
  const df = filters?.district ?? "";
  const qf = filters?.query ?? "";

  return _getListedDoctorsCached(sf, gf, df, qf);
}

const _getListedDoctorsCached = unstable_cache(
  async (specialtyId: string, governorate: string, district: string, query: string) => {
    // Build location filter
    let addressFilter: { clinicAddress: { contains: string } } | undefined;
    if (district && governorate) {
      const gov = IRAQ_GOVERNORATES.find((g) => g.id === governorate);
      const d = gov?.districts.find((d) => d.id === district);
      if (d) addressFilter = { clinicAddress: { contains: d.ar } };
    } else if (governorate) {
      const gov = IRAQ_GOVERNORATES.find((g) => g.id === governorate);
      if (gov) addressFilter = { clinicAddress: { contains: gov.ar } };
    }

    const doctors = await prisma.doctor.findMany({
      where: {
        isActive: true,
        ...(specialtyId ? { specialtyId } : {}),
        ...(addressFilter ?? {}),
        ...(query
          ? {
              OR: [
                { name:          { contains: query } },
                { nameAr:        { contains: query } },
                { clinicAddress: { contains: query } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        specialtyId: true,
        specialty: { select: { id: true, name: true, nameAr: true } },
        phone: true,
        clinicLat: true,
        clinicLng: true,
        clinicAddress: true,
        consultationFee: true,
        showConsultationFee: true,
        workingDays: true,
        workingHoursStart: true,
        workingHoursEnd: true,
        experienceYears: true,
        bio: true,
        bioAr: true,
        logoUrl: true,
      },
      orderBy: { nameAr: "asc" },
      take: 500, // hard cap: no unbounded queries
    });

    const priority = await getPriorityDoctorIds(doctors.map((d) => d.id));
    return sortByPriority(doctors, priority);
  },
  ["doctors-list"],
  { revalidate: TTL_DOCTORS, tags: ["doctors-list"] }
);

// ─── Priority (subscription) check ────────────────────────────────────────────
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

// ─── Single doctor public page ─────────────────────────────────────────────────
export const getPublicDoctorById = unstable_cache(
  async (id: string) =>
    prisma.doctor.findFirst({
      where: { id, isActive: true },
      include: { specialty: true },
    }),
  ["doctor-by-id"],
  { revalidate: TTL_DOCTOR_PAGE, tags: ["doctors-list"] }
);

// ─── Subscription status ───────────────────────────────────────────────────────
/**
 * Checks whether a doctor has an active paid subscription.
 * Used to gate clinic management features.
 * Short TTL (30 s) so a new subscription activates quickly.
 */
export const hasActiveSubscription = unstable_cache(
  async (doctorId: string): Promise<boolean> => {
    const sub = await prisma.doctorSubscription.findFirst({
      where: { doctorId, expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    return !!sub;
  },
  ["subscription"],
  { revalidate: TTL_SUBSCRIPTION, tags: ["subscriptions"] }
);
