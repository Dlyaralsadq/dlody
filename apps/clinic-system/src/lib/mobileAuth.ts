/**
 * Mobile JWT auth utilities.
 * Uses the same SESSION_SECRET as the web cookie system.
 * Token format: base64url(payload).base64url(signature)
 */
import crypto from "crypto";
import type { NextRequest } from "next/server";

export interface MobileSession {
  userId: string;
  username: string;
  name: string;
  role: string;
  isActive: boolean;
  exp: number;
}

const MOBILE_TOKEN_TTL = 60 * 60 * 24 * 90; // 90 days for mobile

function secret(): string {
  const s = process.env.SESSION_SECRET?.trim();
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production")
    throw new Error("SESSION_SECRET required in production");
  return "clinicpro-dev-session-secret-do-not-use-in-production";
}

export function createMobileToken(
  payload: Omit<MobileSession, "exp">,
  ttlSeconds = MOBILE_TOKEN_TTL
): string {
  const full: MobileSession = { ...payload, exp: Date.now() + ttlSeconds * 1000 };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyMobileToken(token: string): MobileSession | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const sig  = token.slice(dot + 1);

  const expected = crypto
    .createHmac("sha256", secret())
    .update(body)
    .digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  )
    return null;

  try {
    const session = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as MobileSession;
    if (!session.userId || !session.role) return null;
    if (!session.exp || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

/** Extract and verify Bearer token from request. Returns null if missing/invalid. */
export function getMobileSession(req: NextRequest): MobileSession | null {
  const auth = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyMobileToken(auth.slice(7));
}

/** Standard error responses */
export function unauthorized(msg = "Unauthorized") {
  return Response.json({ error: msg }, { status: 401 });
}

export function forbidden(msg = "Forbidden") {
  return Response.json({ error: msg }, { status: 403 });
}

export function notFound(msg = "Not found") {
  return Response.json({ error: msg }, { status: 404 });
}

export function badRequest(msg = "Bad request") {
  return Response.json({ error: msg }, { status: 400 });
}

export function ok<T>(data: T, status = 200) {
  return Response.json(data, { status });
}
