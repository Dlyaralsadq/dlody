import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, ok } from "@/lib/mobileAuth";
import { getExploreFeed } from "@/app/actions/patientSocial";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || session.role !== "patient") return unauthorized();
  const feed = await getExploreFeed(session.userId);
  return ok(feed);
}
