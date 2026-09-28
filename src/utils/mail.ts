import "server-only";

import { headers } from "next/headers";

// Addresses under the reserved .invalid top-level domain can never receive mail.
export const SAMPLE_EMAIL_DOMAIN = "@sample.calibre.invalid";

type Mail = { to: string; subject: string; text: string; html?: string };

// Sends through Resend when RESEND_API_KEY is set. Without it the message is logged,
// and callers show the link to the admin so it can be passed on by hand.
export async function sendMail({ to, subject, text, html }: Mail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  // The fictional people in a sample workspace (src/utils/sample-workspace.ts) are never emailed.
  if (to.endsWith(SAMPLE_EMAIL_DOMAIN)) {
    return false;
  }

  if (!apiKey) {
    // The text can hold one-time links, so it is only printed during development.
    const body = process.env.NODE_ENV === "production" ? "" : `:\n${text}`;
    console.info(`[mail] RESEND_API_KEY not set; not sending "${subject}" to ${to}${body}`);
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM ?? "Calibre <no-reply@example.com>", to, subject, text, html }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      console.error(`[mail] Resend refused "${subject}": ${response.status} ${await response.text()}`);
    }

    return response.ok;
  } catch (error) {
    console.error(`[mail] Could not reach Resend for "${subject}"`, error);
    return false;
  }
}

// Absolute URL for links in emails. APP_URL wins; otherwise, during development only, the
// request's own host. Production requires APP_URL (src/utils/environment.ts): the Host header
// is whatever the sender wrote, and a reset link built from it would hand the token to them.
export async function absoluteUrl(path: string) {
  if (process.env.APP_URL) {
    return new URL(path, process.env.APP_URL).toString();
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_URL must be set in production");
  }

  let requestHeaders: Awaited<ReturnType<typeof headers>> | null = null;
  try {
    requestHeaders = await headers();
  } catch {
    // Not inside a request.
  }

  const host = requestHeaders?.get("x-forwarded-host") ?? requestHeaders?.get("host") ?? `localhost:${process.env.PORT ?? 3000}`;
  const protocol = requestHeaders?.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}${path}`;
}
