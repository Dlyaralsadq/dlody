import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function loadRootEnv(root) {
  for (const name of [".env.local", ".env"]) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (process.env[key] !== undefined) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadRootEnv(root);
const schemaPath = path.join(root, "packages", "database", "prisma", "schema.prisma");
const url = process.env.DATABASE_URL ?? "";
const provider = url.startsWith("postgresql://") || url.startsWith("postgres://")
  ? "postgresql"
  : url.startsWith("file:")
    ? "sqlite"
    : null;

const text = fs.readFileSync(schemaPath, "utf8");
if (!provider) {
  const current = text.match(/provider\s*=\s*"(sqlite|postgresql)"/);
  console.log(`prisma provider: ${current ? current[1] : "unchanged"}`);
} else {
  const next = text.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${provider}"`);
  if (next !== text) fs.writeFileSync(schemaPath, next);
  console.log(`prisma provider: ${provider}`);
}
