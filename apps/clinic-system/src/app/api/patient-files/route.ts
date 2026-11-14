import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertClinicAccess } from "@/lib/clinicAccess";
import { savePatientFile } from "@/lib/patientFileStore";

export const runtime = "nodejs";

const CATEGORIES = new Set(["image", "lab", "pdf"]);

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const doctorId = String(form.get("doctorId") ?? "");
    const patientId = String(form.get("patientId") ?? "");
    const category = String(form.get("category") ?? "image");
    const title = String(form.get("title") ?? "").trim();
    const note = String(form.get("note") ?? "").trim();
    const file = form.get("file");

    if (!doctorId || !patientId || !(file instanceof File)) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    if (!(await assertClinicAccess(doctorId))) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, doctorId },
      select: { id: true },
    });
    if (!patient) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (!CATEGORIES.has(category)) return NextResponse.json({ error: "invalid" }, { status: 400 });

    const saved = await savePatientFile(file);
    if ("error" in saved) return NextResponse.json({ error: saved.error }, { status: 400 });

    const doc = await prisma.patientDocument.create({
      data: {
        doctorId,
        patientId,
        category,
        title: title || saved.fileName,
        note: note || null,
        fileName: saved.fileName,
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
        storageKey: saved.storageKey,
      },
    });

    return NextResponse.json({ id: doc.id });
  } catch (err) {
    console.error("[patient-files]", err);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
