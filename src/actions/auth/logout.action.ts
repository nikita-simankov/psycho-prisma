"use server";

import { lucia } from "@/utils/authentication";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
  const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value;

  if (sessionId) {
    await lucia.invalidateSession(sessionId);
  }

  const sessionCookie = lucia.createBlankSessionCookie();
  (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  redirect("/auth/sign-in");
}
