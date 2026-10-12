import type { NextConfig } from "next";

/**
 * `npm run export` baut eine statische Fassung (nur HTML/JS/CSS/Medien) für
 * klassisches Webhosting per FTP. BASE_PATH ist der Unterordner auf dem Server,
 * z. B. "/neu" für ristorante-pizzeria-italia.com/neu/.
 */
const isExport = process.env.STATIC_EXPORT === "1";
const basePath = isExport ? (process.env.BASE_PATH ?? "") : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(isExport ? { output: "export" as const, trailingSlash: true } : {}),
  images: {
    // Ohne Node-Server gibt es keine Bildoptimierung; die Bilder werden direkt ausgeliefert.
    unoptimized: isExport,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1080, 1440, 1920, 2560],
  },
  experimental: {
    // Tree-shake the heavy barrels so only what we import ships.
    optimizePackageImports: ["three", "@react-three/drei", "framer-motion", "gsap", "react-use"],
  },
  ...(isExport
    ? {}
    : {
        async headers() {
          return [
            {
              // Flow assets are immutable; let the CDN keep them forever.
              source: "/media/:path*",
              headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
            },
          ];
        },
      }),
};

export default nextConfig;
