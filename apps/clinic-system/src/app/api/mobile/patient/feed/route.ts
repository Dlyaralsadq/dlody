import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, ok } from "@/lib/mobileAuth";
import { getPatientHomeFeed } from "@/app/actions/patientSocial";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || session.role !== "patient") return unauthorized();

  try {
    const feed = await getPatientHomeFeed(session.userId);
    return ok({
      following: feed.followingPosts,
      suggested: feed.suggestedPosts,
      showSuggestedOnly: feed.showSuggestedOnly,
      showSuggestedSection: feed.showSuggestedSection,
    });
  } catch (err) {
    console.error("[mobile/patient/feed GET]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
