import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";

const defaultUrl = `file:${path.join(__dirname, "prisma", "dev.db")}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? defaultUrl,
  },
});
