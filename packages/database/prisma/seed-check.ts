/**
 * Runs the full seed only if no admin user exists.
 * Safe to run on every deployment.
 */
async function createPrisma() {
  const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const { Pool } = await import("pg");
    const { PrismaClient } = await import("@prisma/client");
    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    return new PrismaClient({ adapter: new PrismaPg(pool) });
  }
  const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
  const { PrismaClient } = await import("@prisma/client");
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: dbUrl }) });
}

async function main() {
  const prisma = await createPrisma();
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      console.log("🌱 Database empty — running seed...");
      await prisma.$disconnect();
      const { execSync } = await import("child_process");
      execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
    } else {
      console.log(`✅ Database has ${count} user(s) — skipping seed.`);
      await prisma.$disconnect();
    }
  } catch (e) {
    await prisma.$disconnect();
    throw e;
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
