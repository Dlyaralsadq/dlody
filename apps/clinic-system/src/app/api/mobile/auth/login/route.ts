import type { NextRequest } from "next/server";
import { verifyPassword } from "@/lib/auth";
import { createMobileToken, ok, unauthorized, badRequest } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

function isEmailLike(s: string) {
  return s.includes("@");
}

/** Mobile-specific resolver: allows email OR username for any role */
async function findUserForMobile(identifier: string) {
  const id = identifier.trim();
  if (!id) return null;

  if (isEmailLike(id)) {
    const email = id.toLowerCase();
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) return byEmail;
    // Also check doctor email
    const doctor = await prisma.doctor.findFirst({
      where: { email },
      select: { user: true },
    });
    return doctor?.user ?? null;
  }

  // Username — allow any role (doctor, admin, secretary, patient)
  return prisma.user.findUnique({ where: { username: id } });
}

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();
    if (!identifier || !password) return badRequest("identifier and password required");

    const user = await findUserForMobile(identifier);
    if (!user) return unauthorized("invalid_credentials");

    const valid = await verifyPassword(password, user.password);
    if (!valid) return unauthorized("invalid_credentials");

    if (!user.isActive && user.role !== "admin") {
      return unauthorized("suspended");
    }

    // For doctors, also fetch the linked doctor id
    let linkedDoctorId: string | null = null;
    if (user.role === "doctor") {
      const doctor = await prisma.doctor.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      linkedDoctorId = doctor?.id ?? null;
    } else if (user.role === "secretary") {
      const anyUser = user as Record<string, unknown>;
      linkedDoctorId = (typeof anyUser["linkedDoctorId"] === "string" ? anyUser["linkedDoctorId"] : null);
    }

    const token = createMobileToken({
      userId:   user.id,
      username: user.username,
      name:     user.name,
      role:     user.role,
      isActive: user.isActive,
    });

    return ok({
      token,
      user: {
        id:             user.id,
        username:       user.username,
        name:           user.name,
        role:           user.role,
        isActive:       user.isActive,
        email:          user.email,
        phone:          user.phone,
        avatarUrl:      user.avatarUrl,
        linkedDoctorId,
      },
    });
  } catch (err) {
    console.error("[mobile/auth/login]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
