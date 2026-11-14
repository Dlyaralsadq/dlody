import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, ok } from "@/lib/mobileAuth";
import { getSavedPosts } from "@/app/actions/patientSocial";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || session.role !== "patient") return unauthorized();

  try {
    const posts = await getSavedPosts(session.userId);
    return ok({ posts });
  } catch (err) {
    console.error("[mobile/patient/saved GET]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
