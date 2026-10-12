import type { MetadataRoute } from "next";
import { site } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/menu"].map((p) => ({ url: `${site.url}${p}`, changeFrequency: "monthly", priority: p ? 0.7 : 1 }));
}
