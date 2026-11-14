import type { NextRequest } from "next/server";
import { hashPassword } from "@/lib/auth";
import { createMobileToken, ok, badRequest } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";
import { generateId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, gender, dateOfBirth } = await req.json();

    if (!name || !email || !password) {
      return badRequest("name, email, and password are required");
    }
    if (password.length < 6) return badRequest("password_too_short");

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return badRequest("email_taken");

    const hashed = await hashPassword(password);
    const username = `patient_${generateId("P").slice(-8)}`;

    const user = await prisma.user.create({
      data: {
        id:            generateId("USR"),
        username,
        name:          name.trim(),
        email:         normalizedEmail,
        password:      hashed,
        role:          "patient",
        phone:         phone ?? null,
        gender:        gender ?? null,
        dateOfBirth:   dateOfBirth ? new Date(dateOfBirth) : null,
        emailVerified: false,
        isActive:      true,
      },
    });

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
        id:       user.id,
        username: user.username,
        name:     user.name,
        role:     user.role,
        isActive: user.isActive,
        email:    user.email,
        phone:    user.phone,
        avatarUrl: null,
        linkedDoctorId: null,
      },
    }, 201);
  } catch (err) {
    console.error("[mobile/auth/register]", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
