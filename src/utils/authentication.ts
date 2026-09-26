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
  getSessionAttributes: (attributes) => ({ scope: attributes.scope }),
});

// A session opened from a round link: it reaches the person's own assessments only.
export const LINK_SCOPE = "link";

// The role a link session acts with. Staff get a respondent's view until they sign in with a password.
function linkRole(role: string) {
  return role === "candidate" ? "candidate" : "member";
}

export class AuthorizationError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

const validateSession = cache(async () => {
  const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;

  if (!sessionId) {
    return { session: null, user: null };
  }

  const { session, user } = await lucia.validateSession(sessionId);

  // Setting cookies throws when called while rendering a Server Component.
  try {
    if (session?.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }

    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
  } catch {}

  return { session, user };
});

// Whether this request comes from a round link rather than a password sign-in.
export async function isLinkSession() {
  return (await validateSession()).session?.scope === LINK_SCOPE;
}

// Resolves the signed-in user once per request. Never returns the password hash.
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const { user } = await validateSession();

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
  // Set for a round-link session: the role the person really has, while `membership.role`
  // is the respondent role they act with until they sign in with a password.
  linkSessionRole?: string;
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

  const found = await prisma.membership.findMany({
    where: { userId: user.id },
    include: membershipInclude,
    orderBy: { createdAt: "asc" },
  });
  const link = await isLinkSession();
  const memberships = link ? found.map((m) => ({ ...m, role: linkRole(m.role) })) : found;

  const requestedSlug = (await headers()).get(ORGANIZATION_HEADER);
  const remembered = (await cookies()).get(ORGANIZATION_COOKIE)?.value;
  const membership = requestedSlug
    ? memberships.find((m) => m.organization.slug === requestedSlug)
    : memberships.find((m) => m.organization.slug === remembered || m.organizationId === remembered) ?? memberships[0];

  if (!membership) {
    return { user, membership: null, requestedSlug };
  }

  const linkSessionRole = link ? found.find((m) => m.id === membership.id)?.role : undefined;
  return { user, membership, organization: membership.organization, memberships, linkSessionRole };
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

// For actions a round link must not reach: account changes, leaving or creating organizations.
export async function requireFullSession(): Promise<PublicUser> {
  const user = await requireUser();

  if (await isLinkSession()) {
    throw new AuthorizationError("Sign in with your password");
  }

  return user;
}

// Unverified accounts can use Calibre but can't email other people yet.
export function isVerified(user: { emailVerifiedAt: Date | null }) {
  return !!user.emailVerifiedAt;
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
    // Staff who arrived from a round link sign in with their password to open the dashboard.
    if (context.linkSessionRole && can(context.linkSessionRole, permission)) {
      redirect("/auth/sign-in?reason=link");
    }

    redirect(homePath(context.membership));
  }

  return context as Context;
}

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseSessionAttributes: { scope: string };
  }
}
