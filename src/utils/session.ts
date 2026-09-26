import "server-only";

import { lucia } from "./authentication";
import { ORGANIZATION_COOKIE } from "./constants";
import { cookies } from "next/headers";

// Remembers the organization this browser last worked in, for pages outside /[org].
export async function rememberOrganization(slug: string) {
  (await cookies()).set(ORGANIZATION_COOKIE, slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

// Starts a session after a password sign-in ("full") or from a round link ("link").
export async function startSession(userId: string, scope: "full" | "link" = "full") {
  const session = await lucia.createSession(userId, { scope });
  const sessionCookie = lucia.createSessionCookie(session.id);

  (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
}

// Accepts "+7 (912) 345-67-89" as well as "+79123456789".
export function normalizePhone(phone: string) {
  const trimmed = phone.trim();
  return (trimmed.startsWith("+") ? "+" : "") + trimmed.replace(/\D/g, "");
}
