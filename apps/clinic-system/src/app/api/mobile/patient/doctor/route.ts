import type { NextRequest } from "next/server";
import { ok, notFound } from "@/lib/mobileAuth";
import { getPublicDoctorById } from "@/lib/publicDoctors";
import { getDoctorProfilePosts } from "@/app/actions/patientSocial";
import { getDoctorRatingStatsMap } from "@/app/actions/doctorRatings";
import { getAppointmentDaySlots, type DaySlotsResult } from "@/app/actions/appointmentAvailability";

// GET /api/mobile/patient/doctor?id=...&date=... 
// Public (no auth required)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const doctor = await getPublicDoctorById(id);
  if (!doctor) return notFound("Doctor not found");

  const dateParam = searchParams.get("date");
  const viewerId  = searchParams.get("viewerId") ?? undefined;

  const [posts, ratingsMap] = await Promise.all([
    getDoctorProfilePosts(id, viewerId ?? ""),
    getDoctorRatingStatsMap([id]),
  ]);

  let slotsResult: DaySlotsResult | null = null;
  if (dateParam) {
    slotsResult = await getAppointmentDaySlots(id, dateParam);
  }

  return ok({
    doctor,
    posts,
    rating: (() => {
      const r = ratingsMap.get(id);
      return r ? { avg: r.average, count: r.count } : { avg: 0, count: 0 };
    })(),
    slots: slotsResult,
  });
}
