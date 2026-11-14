import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, notFound, ok } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

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

    const patientId = session.userId;

    const existing = await prisma.savedPost.findUnique({
      where: { postId_patientId: { postId, patientId } },
    });

    if (existing) {
      await prisma.savedPost.delete({ where: { id: existing.id } });
      return ok({ saved: false });
    }

    await prisma.savedPost.create({ data: { postId, patientId } });
    return ok({ saved: true });
  } catch (err) {
    console.error("[mobile/patient/posts/[id]/save POST]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
