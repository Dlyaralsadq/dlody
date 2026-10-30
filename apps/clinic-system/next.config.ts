import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@iraq-clinic/database"],
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "trycloudflare.com",
  ],
  // Required for Railway/Docker deployments
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
};

export default withNextIntl(nextConfig);
