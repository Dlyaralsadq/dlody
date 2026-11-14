import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function defaultDatabaseUrl(): string {
  // __dirname is unreliable inside Next.js server bundles.
  // Try several candidate locations in order.
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "../../packages/database/prisma/dev.db"),
    path.join(cwd, "packages/database/prisma/dev.db"),
    path.join(__dirname, "../prisma/dev.db"),
    path.join(__dirname, "../../prisma/dev.db"),
    path.join(cwd, "dev.db"),
  ];
  for (const p of candidates) {
    try {
      fs.statSync(p);
      return `file:${p}`;
    } catch {}
  }
  return `file:${candidates[0]}`;
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL ?? defaultDatabaseUrl();

  if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
    const { PrismaPg } = require("@prisma/adapter-pg");
    const { Pool } = require("pg");
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      // ── Pool tuning for production load ──────────────────────────────────
      // Neon serverless: connections are lightweight; keep more open to reduce
      // per-request latency from cold-connection overhead.
      max: parseInt(process.env.PG_POOL_MAX ?? "20", 10),
      // Release idle connections after 30 s to avoid hitting Neon's concurrent
      // connection limit on the Free / Launch plan.
      idleTimeoutMillis: 30_000,
      // Fail fast if the pool is saturated — better than queuing indefinitely.
      connectionTimeoutMillis: 5_000,
      // Kill any server-side query that runs longer than 15 s.
      statement_timeout: 15_000,
      // Release transactions that have been idle for more than 30 s.
      idle_in_transaction_session_timeout: 30_000,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
