import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, ok } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || session.role !== "patient") return unauthorized();

  try {
    const now = new Date();
    const patientId = session.userId;

    // Get followed doctor IDs
    const follows = await prisma.doctorFollow.findMany({
      where: { patientId },
      select: { doctorId: true },
    });
    const followedDoctorIds = follows.map((f) => f.doctorId);

    // Fetch active stories: followed doctors first, then suggested
    const allStories = await prisma.doctorStory.findMany({
      where: { expiresAt: { gt: now } },
      include: {
        doctor: {
          select: { id: true, nameAr: true, name: true, logoUrl: true, isActive: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by doctorId
    const grouped = new Map<
      string,
      {
        doctorId: string;
        doctor: { id: string; nameAr: string; name: string; logoUrl: string | null };
        isFollowing: boolean;
        stories: { id: string; mediaUrl: string; mediaType: string; caption: string | null }[];
      }
    >();

    for (const story of allStories) {
      if (!story.doctor.isActive) continue;
      const key = story.doctorId;
      if (!grouped.has(key)) {
        grouped.set(key, {
          doctorId: story.doctorId,
          doctor: {
            id: story.doctor.id,
            nameAr: story.doctor.nameAr,
            name: story.doctor.name,
            logoUrl: story.doctor.logoUrl,
          },
          isFollowing: followedDoctorIds.includes(story.doctorId),
          stories: [],
        });
      }
      grouped.get(key)!.stories.push({
        id: story.id,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        caption: story.caption,
      });
    }

    const all = Array.from(grouped.values());
    // Sort: followed first, then others
    all.sort((a, b) => {
      if (a.isFollowing === b.isFollowing) return 0;
      return a.isFollowing ? -1 : 1;
    });

    return ok({ stories: all });
  } catch (err) {
    console.error("[mobile/patient/stories GET]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
