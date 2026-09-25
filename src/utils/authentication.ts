import "server-only";

import { prisma } from "@/utils/database";
import type { Prisma } from "@prisma/client";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { Lucia, TimeSpan } from "lucia";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { COOKIE_NAME, ORGANIZATION_COOKIE, ORGANIZATION_HEADER } from "./constants";
import { can, type Permission } from "./roles";
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

const membershipInclude = {
  organization: { select: { id: true, name: true, slug: true, privacyContact: true, respondentFeedback: true } },
} as const;

export type Context = {
  user: PublicUser;
  membership: Prisma.MembershipGetPayload<{ include: typeof membershipInclude }>;
  organization: Prisma.MembershipGetPayload<{ include: typeof membershipInclude }>["organization"];
  memberships: Context["membership"][];
};

type NoOrganization = { user: PublicUser; membership: null; requestedSlug: string | null };

// The signed-in user and the organization they are working in. Under /[org] that is
// the organization in the URL (null membership when they don't belong to it);
// elsewhere it is the last one they opened, falling back to their oldest membership.
export const getContext = cache(async (): Promise<Context | NoOrganization | null> => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: membershipInclude,
    orderBy: { createdAt: "asc" },
  });

  const requestedSlug = headers().get(ORGANIZATION_HEADER);
  const remembered = cookies().get(ORGANIZATION_COOKIE)?.value;
  const membership = requestedSlug
    ? memberships.find((m) => m.organization.slug === requestedSlug)
    : memberships.find((m) => m.organization.slug === remembered || m.organizationId === remembered) ?? memberships[0];

  if (!membership) {
    return { user, membership: null, requestedSlug };
  }

  return { user, membership, organization: membership.organization, memberships };
});

// Where a person lands after signing in.
export function homePath(membership: { role: string; organization: { slug: string } } | null) {
  if (!membership) return "/organizations/new";
  return can(membership.role, "viewDashboard") ? `/${membership.organization.slug}` : "/assessments";
}

// For server actions: throws when there is no signed-in user.
export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthorizationError();
  }

  return user;
}

// For server actions: throws unless the user belongs to an organization
// and, when given, their role there has the permission.
export async function requireMember(permission?: Permission): Promise<Context> {
  const context = await getContext();

  if (!context) {
    throw new AuthorizationError();
  }

  if (!context.membership || (permission && !can(context.membership.role, permission))) {
    throw new AuthorizationError("Forbidden");
  }

  return context as Context;
}

// For pages and layouts: redirects instead of throwing.
export async function ensureUser(): Promise<PublicUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return user;
}

export async function ensureMember(permission?: Permission): Promise<Context> {
  const context = await getContext();

  if (!context) {
    redirect("/auth/sign-in");
  }

  if (!context.membership) {
    // An organization in the URL that this person doesn't belong to looks like it doesn't exist.
    if (context.requestedSlug) {
      notFound();
    }

    redirect("/organizations/new");
  }

  if (permission && !can(context.membership.role, permission)) {
    redirect(homePath(context.membership));
  }

  return context as Context;
}

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
  }
}
