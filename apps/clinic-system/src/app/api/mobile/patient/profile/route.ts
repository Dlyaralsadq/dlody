import type { NextRequest } from "next/server";
import { getMobileSession, unauthorized, notFound, ok } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || session.role !== "patient") return unauthorized();

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        name: true,
        email: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        bloodType: true,
        avatarUrl: true,
      },
    });

    if (!user) return notFound("User not found");

    return ok(user);
  } catch (err) {
    console.error("[mobile/patient/profile GET]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session || session.role !== "patient") return unauthorized();

  try {
    const body = await req.json();

    // Only allow safe profile fields
    const { name, email, phone, gender, dateOfBirth, bloodType, avatarUrl } = body ?? {};

    const data: Record<string, unknown> = {};
    if (name !== undefined)        data.name = name;
    if (email !== undefined)       data.email = email;
    if (phone !== undefined)       data.phone = phone;
    if (gender !== undefined)      data.gender = gender;
    if (bloodType !== undefined)   data.bloodType = bloodType;
    if (avatarUrl !== undefined)   data.avatarUrl = avatarUrl;
    if (dateOfBirth !== undefined) {
      data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    await prisma.user.update({
      where: { id: session.userId },
      data,
    });

    return ok({ success: true });
  } catch (err) {
    console.error("[mobile/patient/profile PATCH]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
