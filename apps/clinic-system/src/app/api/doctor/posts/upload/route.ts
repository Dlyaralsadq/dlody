import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth";
import { savePostMediaFile } from "@/lib/postMediaUpload";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getAppSession();
  if (!session || session.role !== "doctor") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "no_file" }, { status: 400 });
    }

    const result = await savePostMediaFile(session.userId, file);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      url: result.url,
      mediaType: result.mediaType,
    });
  } catch (err) {
    console.error("[posts/upload]", err);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
