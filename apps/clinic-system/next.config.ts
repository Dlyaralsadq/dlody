import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import fs from "fs";
import os from "os";
import path from "path";

const repoRoot = path.resolve(__dirname, "../..");
for (const name of [".env.local", ".env"]) {
    const file = path.join(/* turbopackIgnore: true */ repoRoot, name);
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

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** Allow server actions from LAN IPs (phone/tablet on same Wi‑Fi). */
function getDevOrigins(): string[] {
  const origins = new Set<string>([
    "localhost",
    "127.0.0.1",
    "*.trycloudflare.com",
    "trycloudflare.com",
  ]);
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      const isV4 = net.family === "IPv4" || net.family === 4;
      if (isV4 && !net.internal) origins.add(net.address);
    }
  }
  return [...origins];
}

const nextConfig: NextConfig = {
  transpilePackages: ["@iraq-clinic/database"],
  allowedDevOrigins: getDevOrigins(),
  experimental: {
    serverActions: {
      bodySizeLimit: "26mb",
    },
  },
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  async rewrites() {
    return [
      { source: "/uploads/:path*", destination: "/api/stored-media/:path*" },
    ];
  },
};

export default withNextIntl(nextConfig);
