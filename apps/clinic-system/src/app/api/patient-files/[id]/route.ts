import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertClinicAccess } from "@/lib/clinicAccess";
import { readPatientFile } from "@/lib/patientFileStore";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const doc = await prisma.patientDocument.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!(await assertClinicAccess(doc.doctorId))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const bytes = await readPatientFile(doc.storageKey);
  if (!bytes) return NextResponse.json({ error: "missing" }, { status: 404 });

  const safeName = doc.fileName.replace(/[^\w.\-\u0600-\u06FF ]+/g, "_");
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
