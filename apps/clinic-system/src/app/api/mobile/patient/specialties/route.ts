import type { NextRequest } from "next/server";
import { ok } from "@/lib/mobileAuth";
import { getPublicSpecialties } from "@/lib/publicDoctors";

export async function GET(_req: NextRequest) {
  const specialties = await getPublicSpecialties();
  return ok(specialties);
}
