import "server-only";

import { prisma } from "@/utils/database";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { Lucia, TimeSpan } from "lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { COOKIE_NAME } from "./constants";
import { publicUserSelect, PublicUser } from "./user";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    name: COOKIE_NAME,
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
  sessionExpiresIn: new TimeSpan(1, "d"),
});

export class AuthorizationError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

// Resolves the signed-in user once per request. Never returns the password hash.
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;

  if (!sessionId) {
    return null;
  }

  const { session, user } = await lucia.validateSession(sessionId);

  // Setting cookies throws when called while rendering a Server Component.
  try {
    if (session?.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }

    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
  } catch {}

  if (!user) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: user.id },
    select: publicUserSelect,
  });
});

// For server actions: throws when there is no signed-in user.
export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthorizationError();
  }

  return user;
}

// For server actions: throws unless the signed-in user is an admin.
export async function requireAdmin(): Promise<PublicUser> {
  const user = await requireUser();

  if (user.role !== "admin") {
    throw new AuthorizationError("Forbidden");
  }

  return user;
}

// For pages and layouts: redirects instead of throwing.
export async function ensureUser(): Promise<PublicUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return user;
}

export async function ensureAdmin(): Promise<PublicUser> {
  const user = await ensureUser();

  if (user.role !== "admin") {
    redirect("/forms");
  }

  return user;
}

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
  }
}
