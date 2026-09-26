"use server";

import { lucia } from "@/utils/authentication";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Signs out. A form can pass `next` (a path on this site) to come back to, so signing out to
// accept an invitation as someone else doesn't lose the invitation.
export async function logout(form?: FormData) {
  const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value;

  if (sessionId) {
    await lucia.invalidateSession(sessionId);
  }

  const sessionCookie = lucia.createBlankSessionCookie();
  (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  const next = form?.get("next");
  redirect(typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/auth/sign-in");
}
