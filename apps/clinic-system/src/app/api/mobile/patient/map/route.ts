import type { NextRequest } from "next/server";
import { fetchMapDoctorPins } from "@/app/actions/patientMap";
import { ok } from "@/lib/mobileAuth";

// Public endpoint — no auth required (map is visible to all)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const pins = await fetchMapDoctorPins({
    specialty: searchParams.get("specialty") ?? undefined,
    gov:       searchParams.get("gov") ?? undefined,
    district:  searchParams.get("district") ?? undefined,
    q:         searchParams.get("q") ?? undefined,
  });
  return ok(pins);
}
