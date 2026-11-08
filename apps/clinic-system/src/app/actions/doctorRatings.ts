"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

export type DoctorRatingStats = {
  average: number;
  count: number;
  patientScore: number | null;
};

const EMPTY_STATS: DoctorRatingStats = { average: 0, count: 0, patientScore: null };

/** Prisma delegate — null when client was not regenerated after schema change. */
function ratings() {
  return (prisma as { doctorRating?: typeof prisma.doctorRating }).doctorRating ?? null;
}

export async function getDoctorRatingStats(
  doctorId: string,
  patientId?: string
): Promise<DoctorRatingStats> {
  const model = ratings();
  if (!model) return EMPTY_STATS;

  const [agg, patientRating] = await Promise.all([
    model.aggregate({
      where: { doctorId },
      _avg: { score: true },
      _count: { score: true },
    }),
    patientId
      ? model.findUnique({
          where: { patientId_doctorId: { patientId, doctorId } },
          select: { score: true },
        })
      : Promise.resolve(null),
  ]);

  return {
    average: agg._avg.score ? Math.round(agg._avg.score * 10) / 10 : 0,
    count: agg._count.score,
    patientScore: patientRating?.score ?? null,
  };
}

export async function getDoctorRatingStatsMap(
  doctorIds: string[]
): Promise<Map<string, { average: number; count: number }>> {
  if (doctorIds.length === 0) return new Map();

  const model = ratings();
  if (!model) return new Map();

  const rows = await model.findMany({
    where: { doctorId: { in: doctorIds } },
    select: { doctorId: true, score: true },
  });

  const buckets = new Map<string, { sum: number; count: number }>();
  for (const row of rows) {
    const cur = buckets.get(row.doctorId) ?? { sum: 0, count: 0 };
    cur.sum += row.score;
    cur.count += 1;
    buckets.set(row.doctorId, cur);
  }

  return new Map(
    [...buckets.entries()].map(([doctorId, { sum, count }]) => [
      doctorId,
      { average: Math.round((sum / count) * 10) / 10, count },
    ])
  );
}

export async function rateDoctor(
  doctorId: string,
  score: number
): Promise<{ success: boolean; error?: string; stats?: DoctorRatingStats }> {
  const session = await getSession();
  if (!session || session.role !== "patient") {
    return { success: false, error: "unauthorized" };
  }

  const model = ratings();
  if (!model) {
    return { success: false, error: "not_ready" };
  }

  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return { success: false, error: "invalid_score" };
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId, isActive: true },
    select: { id: true },
  });
  if (!doctor) return { success: false, error: "not_found" };

  await model.upsert({
    where: {
      patientId_doctorId: { patientId: session.userId, doctorId },
    },
    create: { patientId: session.userId, doctorId, score },
    update: { score },
  });

  const stats = await getDoctorRatingStats(doctorId, session.userId);

  revalidatePath("/[locale]/patient/doctor/[id]", "page");
  revalidatePath("/[locale]/doctor/posts", "page");
  revalidatePath("/[locale]/patient", "page");
  revalidatePath("/[locale]/patient/explore", "page");
  revalidatePath("/[locale]/patient/updates", "page");

  return { success: true, stats };
}
