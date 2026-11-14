import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, ok, badRequest } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || session.role !== "doctor") return unauthorized();

  const doctor = await prisma.doctor.findFirst({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!doctor) return Response.json({ error: "not_found" }, { status: 404 });

  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);
  const pageSize = 20;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { doctorId: doctor.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.post.count({ where: { doctorId: doctor.id } }),
  ]);

  return ok({
    posts: posts.map((p) => ({
      ...p,
      likeCount:    p._count.likes,
      commentCount: p._count.comments,
    })),
    total,
  });
}

export async function POST(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || session.role !== "doctor") return unauthorized();

  try {
    const doctor = await prisma.doctor.findFirst({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!doctor) return Response.json({ error: "not_found" }, { status: 404 });

    const body = await req.json();
    const { content, imageUrl, videoUrl } = body;
    if (!content?.trim()) return badRequest("content is required");

    const mediaType = videoUrl ? "video" : imageUrl ? "image" : null;

    const post = await prisma.post.create({
      data: {
        doctorId: doctor.id,
        content:  content.trim(),
        imageUrl: imageUrl ?? null,
        videoUrl: videoUrl ?? null,
        mediaType,
      },
    });

    return ok({ success: true, postId: post.id }, 201);
  } catch (err) {
    console.error("[mobile/doctor/posts POST]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || session.role !== "doctor") return unauthorized();

  const postId = req.nextUrl.searchParams.get("id");
  if (!postId) return badRequest("id required");

  const doctor = await prisma.doctor.findFirst({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!doctor) return Response.json({ error: "not_found" }, { status: 404 });

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.doctorId !== doctor.id) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.post.delete({ where: { id: postId } });
  return ok({ success: true });
}
