/**
 * ONE-TIME admin account setup tool.
 * Protected by SESSION_SECRET — only someone with Railway access can use it.
 *
 * Usage (call from browser or curl):
 *   POST https://tabibee.com/api/admin/account-setup
 *   Headers:
 *     Content-Type: application/json
 *     Authorization: Bearer <your SESSION_SECRET value from Railway>
 *   Body:
 *     {
 *       "action": "migrate_email",
 *       "email": "dodo.dlo.duorod@gmail.com",
 *       "newPassword": "YourNewPassword123"
 *     }
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

function safeEqual(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) {
      // Still do the comparison to avoid timing leaks
      crypto.timingSafeEqual(ab, Buffer.alloc(ab.length));
      return false;
    }
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // ── Auth: requires the full SESSION_SECRET as Bearer token ──────────────
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const secret = process.env.SESSION_SECRET ?? "";

  if (!secret || !token || !safeEqual(token, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { action, email, newPassword } = body as {
    action?: string;
    email?: string;
    newPassword?: string;
  };

  if (action !== "migrate_email" || !email || !newPassword) {
    return NextResponse.json(
      { error: "Required: action='migrate_email', email, newPassword" },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "newPassword must be at least 6 characters" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const results: string[] = [];

  // ── 1. Delete patient User account with this email ──────────────────────
  const patientUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (patientUser) {
    if (patientUser.role === "admin" || patientUser.role === "superadmin") {
      return NextResponse.json(
        { error: "This email is already on an admin account — no action taken." },
        { status: 409 }
      );
    }
    await prisma.user.delete({ where: { id: patientUser.id } });
    results.push(`✓ Deleted ${patientUser.role} user: ${normalizedEmail} (id: ${patientUser.id})`);
  } else {
    results.push(`ℹ No patient user found with email ${normalizedEmail}`);
  }

  // ── 2. Find the admin/superadmin user ───────────────────────────────────
  const admin = await prisma.user.findFirst({
    where: { role: { in: ["admin", "superadmin"] } },
    orderBy: { createdAt: "asc" }, // oldest = main admin
  });

  if (!admin) {
    return NextResponse.json({ error: "No admin user found in database", results }, { status: 404 });
  }

  // ── 3. Update admin: set email + new password ───────────────────────────
  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: admin.id },
    data: {
      email: normalizedEmail,
      emailVerified: true,
      password: hashed,
    },
  });

  results.push(`✓ Admin updated: email = ${normalizedEmail}, password reset (id: ${admin.id})`);
  results.push(`✓ You can now log in at tabibee.com/ar/login with your email and new password`);

  return NextResponse.json({ success: true, adminName: admin.name, results });
}
