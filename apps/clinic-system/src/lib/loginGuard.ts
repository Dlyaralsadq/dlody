import crypto from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const memory = new Map<string, { count: number; start: number }>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const raw = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return raw.slice(0, 64);
}

function digest(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 24);
}

export function rateKey(prefix: string, value: string): string {
  return `${prefix}:${digest(value)}`;
}

export function loginKeys(ip: string, identifier: string): { ipKey: string; accountKey: string } {
  return {
    ipKey: `login:ip:${digest(ip)}`,
    accountKey: `login:acct:${digest(`${ip}|${identifier}`)}`,
  };
}

function memoryHit(key: string, limit: number, windowMs: number, increment: boolean): boolean {
  const now = Date.now();
  const row = memory.get(key);
  if (!row || now - row.start > windowMs) {
    if (increment) memory.set(key, { count: 1, start: now });
    return true;
  }
  if (row.count >= limit) return false;
  if (increment) row.count += 1;
  return true;
}

/** Returns true when the caller is still inside the limit. */
export async function allowRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  increment: boolean
): Promise<boolean> {
  const now = new Date();
  try {
    const row = await prisma.authRateLimit.findUnique({ where: { key } });
    const fresh = !row || now.getTime() - row.windowStart.getTime() > windowMs;
    if (fresh) {
      if (!increment) return true;
      await prisma.authRateLimit.upsert({
        where: { key },
        create: { key, count: 1, windowStart: now },
        update: { count: 1, windowStart: now },
      });
      return true;
    }
    if (row.count >= limit) return false;
    if (!increment) return true;
    await prisma.authRateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return true;
  } catch {
    return memoryHit(key, limit, windowMs, increment);
  }
}

export async function clearRateLimit(key: string): Promise<void> {
  memory.delete(key);
  try {
    await prisma.authRateLimit.delete({ where: { key } });
  } catch {
    // Missing row or table.
  }
}
