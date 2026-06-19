import type { NextConfig } from "next";

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
