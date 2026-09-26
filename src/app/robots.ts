import type { MetadataRoute } from "next";
import { INDEXABLE_PATHS, siteUrl } from "@/utils/site";

// Read APP_URL at request time: the Docker build has no APP_URL, so a prerendered file would point at localhost.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    // Only the public pages are listed; private pages also send X-Robots-Tag: noindex (src/proxy.ts).
    rules: { userAgent: "*", allow: INDEXABLE_PATHS.map((path) => (path === "/" ? "/$" : path)), disallow: "/" },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}
