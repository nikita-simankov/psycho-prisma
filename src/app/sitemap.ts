import type { MetadataRoute } from "next";
import { INDEXABLE_PATHS, siteUrl } from "@/utils/site";

// Read APP_URL at request time: the Docker build has no APP_URL, so a prerendered file would point at localhost.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_PATHS.map((path) => ({
    url: new URL(path, siteUrl()).toString(),
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.5,
  }));
}
