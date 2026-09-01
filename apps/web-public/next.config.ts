import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@amemais/shared-types"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.qrserver.com" },
    ],
  },
};

export default nextConfig;
