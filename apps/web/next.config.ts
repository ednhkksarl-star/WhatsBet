import path from "path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Charge le .env à la racine du monorepo (pnpm dev:web lit apps/web par défaut)
loadEnvConfig(path.join(__dirname, "../.."));

const nextConfig: NextConfig = {
  transpilePackages: ["@whatsbet/database", "@whatsbet/shared", "@whatsbet/types"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.qrserver.com" },
    ],
  },
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/favicon.png" }];
  },
};

export default nextConfig;
