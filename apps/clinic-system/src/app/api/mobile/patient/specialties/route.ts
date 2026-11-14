import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, ok } from "@/lib/mobileAuth";
import { getPublicSpecialties } from "@/lib/publicDoctors";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session) return unauthorized();
  const specialties = await getPublicSpecialties();
  return ok(specialties);
}
