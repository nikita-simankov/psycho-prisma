// The public address, for links that leave the app: sitemaps, sharing previews, canonical URLs.
export function siteUrl() {
  return new URL(process.env.APP_URL || `http://localhost:${process.env.PORT ?? 3000}`);
}

// Pages anyone may find through a search engine. Everything else is private or one-off.
export const INDEXABLE_PATHS = ["/", "/privacy", "/auth/sign-in", "/auth/sign-up"];
