import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1080, 1440, 1920, 2560],
  },
  experimental: {
    // Tree-shake the heavy barrels so only what we import ships.
    optimizePackageImports: ["three", "@react-three/drei", "framer-motion", "gsap", "react-use"],
  },
  async headers() {
    return [
      {
        // Flow assets are immutable; let the CDN keep them forever.
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
