"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAppSession } from "@/lib/auth";
import { getDoctorByUserId } from "@/app/actions/doctorPortal";
import { saveStoryMediaFile } from "@/lib/postMediaUpload";

const STORY_HOURS = 24;

async function requireDoctor() {
  const session = await getAppSession();
  if (!session || session.role !== "doctor") return null;
  const doctor = await getDoctorByUserId(session.userId);
  if (!doctor) return null;
  return { session, doctor };
}

function activeStoryWhere() {
  return { expiresAt: { gt: new Date() } };
}

export type StoryFeedDoctor = {
  id: string;
  name: string;
  nameAr: string;
  logoUrl: string | null;
  specialtyId: string;
  hasActiveStory: boolean;
};

export type DoctorStoryItem = {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  createdAt: Date;
  expiresAt: Date;
};

function storyModelAvailable(): boolean {
  return typeof (prisma as { doctorStory?: unknown }).doctorStory !== "undefined";
}

/**
 * Story strip for the patient home/updates page: only doctors the patient
 * follows AND who currently have an active (non-expired) story.
 */
export async function getPatientStoryStrip(patientId: string): Promise<StoryFeedDoctor[]> {
  if (!storyModelAvailable()) return [];

  const follows = await prisma.doctorFollow.findMany({
    where: { patientId },
    select: { doctorId: true },
  });
  const followedIds = follows.map((f) => f.doctorId);
  if (followedIds.length === 0) return [];

  const storyGroups = await prisma.doctorStory.groupBy({
    by: ["doctorId"],
    where: { ...activeStoryWhere(), doctorId: { in: followedIds } },
    _max: { createdAt: true },
  });
  if (storyGroups.length === 0) return [];

  const doctorIds = storyGroups.map((g) => g.doctorId);
  const doctors = await prisma.doctor.findMany({
    where: { id: { in: doctorIds }, isActive: true },
    select: { id: true, name: true, nameAr: true, logoUrl: true, specialtyId: true },
  });

  const latestMap = new Map(storyGroups.map((g) => [g.doctorId, g._max.createdAt?.getTime() ?? 0]));
  const doctorMap = new Map(doctors.map((d) => [d.id, d]));

  return doctorIds
    .map((id) => doctorMap.get(id))
    .filter((d): d is NonNullable<typeof d> => !!d)
    .sort((a, b) => (latestMap.get(b.id) ?? 0) - (latestMap.get(a.id) ?? 0))
    .map((d) => ({ ...d, hasActiveStory: true }));
}

/** Set of doctor ids (from the given list) that currently have an active story. Used to draw the story ring around avatars app-wide. */
export async function getActiveStoryDoctorIds(doctorIds: string[]): Promise<Set<string>> {
  if (!storyModelAvailable() || doctorIds.length === 0) return new Set();
  try {
    const groups = await prisma.doctorStory.groupBy({
      by: ["doctorId"],
      where: { ...activeStoryWhere(), doctorId: { in: doctorIds } },
      _count: { id: true },
    });
    return new Set(groups.map((g) => g.doctorId));
  } catch (err) {
    console.error("[getActiveStoryDoctorIds]", err);
    return new Set();
  }
}

export async function getDoctorStoriesForViewer(
  doctorId: string
): Promise<{ success: boolean; stories?: DoctorStoryItem[]; error?: string }> {
  if (!storyModelAvailable()) return { success: false, error: "not_available" };
  try {
    const stories = await prisma.doctorStory.findMany({
      where: { doctorId, ...activeStoryWhere() },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        mediaUrl: true,
        mediaType: true,
        caption: true,
        createdAt: true,
        expiresAt: true,
      },
    });
    return { success: true, stories };
  } catch (err) {
    console.error("[getDoctorStoriesForViewer]", err);
    return { success: false, error: "fetch_failed" };
  }
}

export async function getDoctorOwnStories(): Promise<DoctorStoryItem[]> {
  const ctx = await requireDoctor();
  if (!ctx || !storyModelAvailable()) return [];

  return prisma.doctorStory.findMany({
    where: { doctorId: ctx.doctor.id, ...activeStoryWhere() },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      mediaUrl: true,
      mediaType: true,
      caption: true,
      createdAt: true,
      expiresAt: true,
    },
  });
}

export async function uploadDoctorStoryMedia(
  formData: FormData
): Promise<{ success: boolean; url?: string; mediaType?: "image" | "video"; error?: string }> {
  const ctx = await requireDoctor();
  if (!ctx) return { success: false, error: "unauthorized" };

  const file = formData.get("file");
  if (!file || !(file instanceof File)) return { success: false, error: "no_file" };

  try {
    const result = await saveStoryMediaFile(ctx.session.userId, file);
    if ("error" in result) return { success: false, error: result.error };
    return { success: true, url: result.url, mediaType: result.mediaType };
  } catch (err) {
    console.error("[uploadDoctorStoryMedia]", err);
    return { success: false, error: "upload_failed" };
  }
}

export async function createDoctorStory(data: {
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
}): Promise<{ success: boolean; error?: string }> {
  const ctx = await requireDoctor();
  if (!ctx) return { success: false, error: "unauthorized" };
  if (!storyModelAvailable()) return { success: false, error: "not_available" };

  const mediaUrl = data.mediaUrl.trim();
  if (!mediaUrl.startsWith("/uploads/stories/")) {
    return { success: false, error: "invalid_media" };
  }

  const expiresAt = new Date(Date.now() + STORY_HOURS * 60 * 60 * 1000);
  const caption = data.caption?.trim() || null;

  await prisma.doctorStory.create({
    data: {
      doctorId: ctx.doctor.id,
      mediaUrl,
      mediaType: data.mediaType,
      caption,
      expiresAt,
    },
  });

  revalidateStoryPaths();
  return { success: true };
}

export async function deleteDoctorStory(
  storyId: string
): Promise<{ success: boolean; error?: string }> {
  const ctx = await requireDoctor();
  if (!ctx) return { success: false, error: "unauthorized" };
  if (!storyModelAvailable()) return { success: false, error: "not_available" };

  const story = await prisma.doctorStory.findUnique({ where: { id: storyId } });
  if (!story || story.doctorId !== ctx.doctor.id) {
    return { success: false, error: "not_found" };
  }

  await prisma.doctorStory.delete({ where: { id: storyId } });
  revalidateStoryPaths();
  return { success: true };
}

function revalidateStoryPaths() {
  revalidatePath("/[locale]/doctor/posts", "page");
  revalidatePath("/[locale]/patient/updates", "page");
}
