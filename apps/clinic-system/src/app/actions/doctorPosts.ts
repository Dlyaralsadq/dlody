"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getDoctorByUserId } from "@/app/actions/doctorPortal";
import { savePostMediaFile } from "@/lib/postMediaUpload";

async function requireDoctor() {
  const session = await getSession();
  if (!session || session.role !== "doctor") return null;
  const doctor = await getDoctorByUserId(session.userId);
  if (!doctor) return null;
  return { session, doctor };
}

type PostMediaInput = {
  imageUrl?: string;
  videoUrl?: string;
  mediaType?: "image" | "video" | null;
};

function normalizeMedia(data: PostMediaInput) {
  const mediaType = data.mediaType ?? (data.videoUrl ? "video" : data.imageUrl ? "image" : null);

  if (mediaType === "video") {
    const videoUrl = data.videoUrl?.trim() || null;
    if (videoUrl && !videoUrl.startsWith("/uploads/posts/")) {
      return { error: "invalid_video" as const };
    }
    return {
      imageUrl: null as string | null,
      videoUrl,
      mediaType: videoUrl ? ("video" as const) : null,
    };
  }

  const imageUrl = data.imageUrl?.trim() || null;
  if (imageUrl && imageUrl.startsWith("data:") && imageUrl.length > 500_000) {
    return { error: "image_too_large" as const };
  }
  if (imageUrl && imageUrl.startsWith("data:") && !imageUrl.startsWith("data:image/")) {
    return { error: "invalid_image" as const };
  }
  if (imageUrl && imageUrl.startsWith("/uploads/posts/") === false && !imageUrl.startsWith("data:") && !imageUrl.startsWith("http")) {
    return { error: "invalid_image" as const };
  }
  return {
    imageUrl,
    videoUrl: null as string | null,
    mediaType: imageUrl ? ("image" as const) : null,
  };
}

export async function getDoctorPosts(doctorId: string) {
  return prisma.post.findMany({
    where: { doctorId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { likes: true, comments: true, savedBy: true } },
    },
  });
}

export async function uploadDoctorPostMedia(
  formData: FormData
): Promise<{ success: boolean; url?: string; mediaType?: "image" | "video"; error?: string }> {
  const ctx = await requireDoctor();
  if (!ctx) return { success: false, error: "unauthorized" };

  const file = formData.get("file");
  if (!file || !(file instanceof File)) return { success: false, error: "no_file" };

  try {
    const result = await savePostMediaFile(ctx.session.userId, file);
    if ("error" in result) return { success: false, error: result.error };
    return { success: true, url: result.url, mediaType: result.mediaType };
  } catch (err) {
    console.error("[uploadDoctorPostMedia]", err);
    return { success: false, error: "upload_failed" };
  }
}

export async function createDoctorPost(
  data: PostMediaInput & { content: string }
): Promise<{ success: boolean; error?: string }> {
  const ctx = await requireDoctor();
  if (!ctx) return { success: false, error: "unauthorized" };

  const content = data.content.trim();
  if (!content) return { success: false, error: "empty_content" };

  const media = normalizeMedia(data);
  if ("error" in media) return { success: false, error: media.error };

  await prisma.post.create({
    data: {
      doctorId: ctx.doctor.id,
      content,
      imageUrl: media.imageUrl,
      videoUrl: media.videoUrl,
      mediaType: media.mediaType,
    },
  });

  revalidatePostPaths();
  return { success: true };
}

export async function updateDoctorPost(
  postId: string,
  data: PostMediaInput & { content: string }
): Promise<{ success: boolean; error?: string }> {
  const ctx = await requireDoctor();
  if (!ctx) return { success: false, error: "unauthorized" };

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.doctorId !== ctx.doctor.id) return { success: false, error: "not_found" };

  const content = data.content.trim();
  if (!content) return { success: false, error: "empty_content" };

  const media = normalizeMedia(data);
  if ("error" in media) return { success: false, error: media.error };

  await prisma.post.update({
    where: { id: postId },
    data: {
      content,
      imageUrl: media.imageUrl,
      videoUrl: media.videoUrl,
      mediaType: media.mediaType,
    },
  });

  revalidatePostPaths();
  return { success: true };
}

export async function deleteDoctorPost(postId: string): Promise<{ success: boolean; error?: string }> {
  const ctx = await requireDoctor();
  if (!ctx) return { success: false, error: "unauthorized" };

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.doctorId !== ctx.doctor.id) return { success: false, error: "not_found" };

  await prisma.post.delete({ where: { id: postId } });

  revalidatePostPaths();
  revalidatePath("/[locale]/patient/saved", "page");
  return { success: true };
}

function revalidatePostPaths() {
  revalidatePath("/[locale]/doctor/posts", "page");
  revalidatePath("/[locale]/patient/doctor/[id]", "page");
  revalidatePath("/[locale]/patient/updates", "page");
}
