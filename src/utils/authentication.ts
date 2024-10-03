import { prisma } from "@/utils/database";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { User } from "@prisma/client";
import { Lucia, TimeSpan } from "lucia";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "./constants";
import { redirect } from "next/navigation";

const adapter = new PrismaAdapter(prisma.session, prisma.user); // your adapter

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    name: COOKIE_NAME,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  sessionExpiresIn: new TimeSpan(1, "d"),
});

export const useSession = async (): Promise<User | null> => {
  const sessionId = cookies().get(lucia.sessionCookieName)?.value || null;

  if (!sessionId) {
    return null;
  }

  const { session, user } = await lucia.validateSession(sessionId);

  try {
    if (session && session.fresh) {
      const sessionCookie = await lucia.createSessionCookie(session.id);

      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );
    }

    if (!session) {
      const sessionCookie = await lucia.createBlankSessionCookie();

      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );
    }
  } catch (e) {}

  const existingUser = await prisma.user.findUnique({
    where: {
      id: user?.id,
    },
  });

  return existingUser;
};

export async function signOut() {
  const sessionCookie = await lucia.createBlankSessionCookie();

  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  redirect("/auth/sign-in");
}

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
  }
}
