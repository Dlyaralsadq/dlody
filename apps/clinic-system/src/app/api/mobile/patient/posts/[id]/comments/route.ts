import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, badRequest, notFound, ok } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return notFound("Post not found");

    const comments = await prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        patient: { select: { name: true } },
      },
    });

    return ok({
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        patient: { name: c.patient.name },
      })),
    });
  } catch (err) {
    console.error("[mobile/patient/posts/[id]/comments GET]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getMobileSession(req);
  if (!session || session.role !== "patient") return unauthorized();

  try {
    const { id: postId } = await params;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return notFound("Post not found");

    const body = await req.json();
    const content = body?.content?.trim();
    if (!content) return badRequest("content is required");

    const comment = await prisma.postComment.create({
      data: { postId, patientId: session.userId, content },
    });

    return ok(
      {
        success: true,
        comment: {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
        },
      },
      201
    );
  } catch (err) {
    console.error("[mobile/patient/posts/[id]/comments POST]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
