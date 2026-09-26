import { PUBLIC_INSTRUMENTS } from "./public-instruments";

// The legal documents under /legal/<name>.
export const LEGAL_DOCUMENTS = ["terms", "dpa", "subprocessors", "refunds"] as const;

// The public address, for links that leave the app: sitemaps, sharing previews, canonical URLs.
export function siteUrl() {
  return new URL(process.env.APP_URL || `http://localhost:${process.env.PORT ?? 3000}`);
}

// Pages anyone may find through a search engine. Everything else is private or one-off.
export const INDEXABLE_PATHS = [
  "/",
  "/product",
  "/pricing",
  "/instruments",
  ...PUBLIC_INSTRUMENTS.map(({ slug }) => `/instruments/${slug}`),
  "/security",
  "/legal",
  ...LEGAL_DOCUMENTS.map((document) => `/legal/${document}`),
  "/privacy",
  "/auth/sign-in",
  "/auth/sign-up",
];
