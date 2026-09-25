import "server-only";

import { lucia } from "./authentication";
import { ORGANIZATION_COOKIE } from "./constants";
import { cookies } from "next/headers";

// Makes an organization the one the dashboard shows for this browser.
export function rememberOrganization(organizationId: string) {
  cookies().set(ORGANIZATION_COOKIE, organizationId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function startSession(userId: string) {
  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
}

// Accepts "+7 (912) 345-67-89" as well as "+79123456789".
export function normalizePhone(phone: string) {
  const trimmed = phone.trim();
  return (trimmed.startsWith("+") ? "+" : "") + trimmed.replace(/\D/g, "");
}
