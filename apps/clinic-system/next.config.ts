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

const isProd = process.env.NODE_ENV === "production";

const securityHeaders: { key: string; value: string }[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      isProd ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      isProd
        ? "connect-src 'self' https://nominatim.openstreetmap.org https://translate.googleapis.com https://api.mymemory.translated.net"
        : "connect-src 'self' ws: wss: http://localhost:* http://127.0.0.1:* https://nominatim.openstreetmap.org https://translate.googleapis.com https://api.mymemory.translated.net",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      isProd ? "upgrade-insecure-requests" : "",
    ].filter(Boolean).join("; "),
  },
];

if (isProd) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=15552000; includeSubDomains",
  });
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@iraq-clinic/database"],
  allowedDevOrigins: getDevOrigins(),
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
