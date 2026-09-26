import "server-only";

import { headers } from "next/headers";

type Mail = { to: string; subject: string; text: string };

// Sends through Resend when RESEND_API_KEY is set. Without it the message is logged,
// and callers show the link to the admin so it can be passed on by hand.
export async function sendMail({ to, subject, text }: Mail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.info(`[mail] RESEND_API_KEY not set; not sending "${subject}" to ${to}:\n${text}`);
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM ?? "Prisma <no-reply@example.com>", to, subject, text }),
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

// Absolute URL for links in emails. APP_URL wins; otherwise the request's own host.
// Scheduled jobs run outside a request, so they need APP_URL to produce working links.
export function absoluteUrl(path: string) {
  if (process.env.APP_URL) {
    return new URL(path, process.env.APP_URL).toString();
  }

  let requestHeaders: ReturnType<typeof headers> | null = null;
  try {
    requestHeaders = headers();
  } catch {
    // Not inside a request.
  }

  const host = requestHeaders?.get("x-forwarded-host") ?? requestHeaders?.get("host") ?? `localhost:${process.env.PORT ?? 3000}`;
  const protocol = requestHeaders?.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}${path}`;
}
