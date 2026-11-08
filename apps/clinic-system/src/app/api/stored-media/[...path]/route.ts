import path from "path";
import { NextResponse } from "next/server";
import { getPublicDir } from "@/lib/appPaths";
import { readStoredObjectOrDisk } from "@/lib/storedObjects";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await context.params;
  if (!parts?.length || parts.some((part) => part === "." || part === ".." || part.includes("\\"))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const key = `uploads/${parts.join("/")}`;
  const diskPath = path.join(getPublicDir(), "uploads", ...parts);
  const file = await readStoredObjectOrDisk(key, diskPath);
  if (!file) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
