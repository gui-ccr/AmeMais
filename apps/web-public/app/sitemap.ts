import type { MetadataRoute } from "next";
import { NAV_ITEMS } from "@/lib/nav";
import { SITE_URL } from "@/lib/site";

const CHANGE_FREQUENCY: Record<string, MetadataRoute.Sitemap[number]["changeFrequency"]> = {
  "/": "weekly",
  "/adote": "daily",
  "/doe": "weekly",
  "/acoes": "weekly",
};

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return NAV_ITEMS.map(({ href }) => ({
    url: `${SITE_URL}${href}`,
    lastModified,
    changeFrequency: CHANGE_FREQUENCY[href] ?? "monthly",
    priority: href === "/" ? 1 : 0.7,
  }));
}
