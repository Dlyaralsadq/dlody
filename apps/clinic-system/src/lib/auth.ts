import crypto from "crypto";
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
const DEFAULT_SESSION_SECONDS = 60 * 60 * 24 * 7;
/** Dev-only fallback so local login keeps working before SESSION_SECRET is set. */
const DEV_SESSION_SECRET = "clinicpro-dev-session-secret-do-not-use-in-production";

function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") return null;
  return DEV_SESSION_SECRET;
}

type SignedSession = Session & { exp: number };

function signSession(payload: SignedSession): string {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET must be at least 32 characters in production");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function decodeLegacySession(token: string): Session | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const session = JSON.parse(decoded) as Session;
    if (!session.userId || !session.role) return null;
    return {
      userId: session.userId,
      username: session.username,
      name: session.name,
      role: session.role,
      isActive: session.isActive ?? true,
    };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(
  userId: string,
  username: string,
  name: string,
  role: string,
  isActive: boolean,
  maxAgeSeconds = DEFAULT_SESSION_SECONDS
): Promise<string> {
  return signSession({
    userId,
    username,
    name,
    role,
    isActive,
    exp: Date.now() + maxAgeSeconds * 1000,
  });
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie) return null;
  return decodeSessionToken(sessionCookie.value);
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

function isEmailLike(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function normalizeDigits(v: string): string {
  return v.replace(/\D/g, "");
}

/**
 * Resolve a login identifier to a User: email, phone digits, or username.
 * Order: email → phone (User.phone / username / Doctor.phone) → username.
 */
export async function findUserByLoginIdentifier(identifierRaw: string) {
  const identifier = identifierRaw.trim();
  if (!identifier) return null;

  if (isEmailLike(identifier)) {
    const email = identifier.toLowerCase();
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) return byEmail;
    const doctor = await prisma.doctor.findUnique({
      where: { email },
      include: { user: true },
    });
    if (doctor?.user) return doctor.user;
    return null;
  }

  const digits = normalizeDigits(identifier);
  if (digits.length >= 7) {
    const byPhone = await prisma.user.findFirst({
      where: { OR: [{ phone: digits }, { username: digits }] },
    });
    if (byPhone) return byPhone;

    const doctor = await prisma.doctor.findFirst({
      where: { phone: digits },
      include: { user: true },
    });
    if (doctor?.user) return doctor.user;
  }

  return prisma.user.findUnique({ where: { username: identifier } });
}

/** Login with username, email, or phone + password. */
export async function login(
  identifier: string,
  password: string,
  maxAgeSeconds = DEFAULT_SESSION_SECONDS
): Promise<{
  success: boolean; error?: string; session?: string; role?: string;
}> {
  const user = await findUserByLoginIdentifier(identifier);
  if (!user) return { success: false, error: "invalid_credentials" };
  const valid = await verifyPassword(password, user.password);
  if (!valid) return { success: false, error: "invalid_credentials" };
  if (isEmailLike(identifier) && user.email && identifier.trim().toLowerCase() === user.email.toLowerCase() && !user.emailVerified) {
    return { success: false, error: "email_unverified" };
  }

  const sessionToken = await createSession(user.id, user.username, user.name, user.role, user.isActive, maxAgeSeconds);
  return { success: true, session: sessionToken, role: user.role };
}

export function SESSION_COOKIE_NAME(): string {
  return SESSION_COOKIE;
}

/** Set session cookie — works on localhost, LAN IP, and HTTPS tunnel. */
export async function setSessionCookie(token: string, maxAge = 60 * 60 * 24 * 7) {
  const { headers } = await import("next/headers");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "";
  const host = h.get("host") ?? "";
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production" || proto === "https" || host.includes("trycloudflare.com"),
  });
}

export function decodeSessionToken(token: string): Session | null {
  const secret = sessionSecret();
  const dot = token.lastIndexOf(".");
  if (!secret || dot <= 0) {
    if (process.env.NODE_ENV === "production") return null;
    return decodeLegacySession(token);
  }

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  const actualBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(actualBuf, expectedBuf)) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SignedSession;
    if (!session.userId || !session.role) return null;
    if (!session.exp || session.exp < Date.now()) return null;
    return {
      userId: session.userId,
      username: session.username,
      name: session.name,
      role: session.role,
      isActive: session.isActive ?? true,
    };
  } catch {
    return null;
  }
}
