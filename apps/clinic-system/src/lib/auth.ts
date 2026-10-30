import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export interface Session {
  userId: string;
  username: string;
  name: string;
  role: string;
  isActive: boolean;
}

const SESSION_COOKIE = "clinic_session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, username: string, name: string, role: string, isActive: boolean): Promise<string> {
  const sessionData = JSON.stringify({ userId, username, name, role, isActive, createdAt: Date.now() });
  return Buffer.from(sessionData).toString("base64");
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie) return null;

  try {
    const decoded = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
    const session = JSON.parse(decoded) as Session & { createdAt: number };
    return { userId: session.userId, username: session.username, name: session.name, role: session.role, isActive: session.isActive ?? true };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Returns redirect path for a valid session, or null if cookie is stale/invalid. */
export async function getAuthenticatedRedirectPath(session: Session, locale: string): Promise<string | null> {
  if (session.role === "admin") return `/${locale}/admin`;
  if (session.role === "secretary") {
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { linkedDoctorId: true } });
    if (!user?.linkedDoctorId) return null;
    return `/${locale}/secretary`;
  }
  if (session.role === "doctor") {
    const doctor = await prisma.doctor.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (!doctor) return null;
    return `/${locale}/doctor`;
  }
  if (session.role === "patient") {
    return `/${locale}/patient/account`;
  }
  return null;
}

export async function requireAuth(locale: string = "ar"): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  // Doctor/Secretary suspended — allow login but block system access
  if (!session.isActive && session.role !== "admin") {
    redirect(`/${locale}/suspended`);
  }
  return session;
}

export async function login(username: string, password: string): Promise<{
  success: boolean; error?: string; session?: string; role?: string;
}> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return { success: false, error: "invalid_credentials" };
  const valid = await verifyPassword(password, user.password);
  if (!valid) return { success: false, error: "invalid_credentials" };

  const sessionToken = await createSession(user.id, user.username, user.name, user.role, user.isActive);
  return { success: true, session: sessionToken, role: user.role };
}

export function SESSION_COOKIE_NAME(): string {
  return SESSION_COOKIE;
}
