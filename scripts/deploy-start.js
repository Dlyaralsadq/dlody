#!/usr/bin/env node
/**
 * Production startup script.
 * 1. Push Prisma schema to DB (creates tables if missing, safe to re-run).
 * 2. Seed admin user if DB is empty.
 * 3. Start Next.js production server.
 */
const { execSync, spawn } = require("child_process");
const path = require("path");

const dbPkgDir = path.join(__dirname, "..", "packages", "database");
const clinicDir = path.join(__dirname, "..", "apps", "clinic-system");

function run(cmd, cwd) {
  console.log(`▶ ${cmd}`);
  execSync(cmd, { cwd: cwd ?? __dirname + "/..", stdio: "inherit" });
}

async function main() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  const isPg = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://");

  console.log("🗄️  Setting up database...");
  if (isPg) {
    // PostgreSQL: push schema (creates tables, safe on redeploy)
    run(`npx prisma db push --skip-generate --accept-data-loss --config prisma.config.ts`, dbPkgDir);
  } else {
    // SQLite fallback (local / Cursor dev)
    run(`npx prisma migrate deploy --config prisma.config.ts`, dbPkgDir);
  }

  // Seed if admin user doesn't exist
  console.log("🌱 Checking seed...");
  try {
    run(`npx tsx prisma/seed-check.ts`, dbPkgDir);
  } catch {
    console.log("⚠️  Seed check skipped");
  }

  // Start server
  console.log("🚀 Starting Next.js server...");
  const port = process.env.PORT ?? 3000;
  const child = spawn(
    "node",
    ["node_modules/.bin/next", "start", "--port", String(port), "--hostname", "0.0.0.0"],
    { cwd: clinicDir, stdio: "inherit", env: process.env }
  );
  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((e) => { console.error(e); process.exit(1); });
