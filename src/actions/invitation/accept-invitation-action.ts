"use server";

import { accountSchema } from "@/app/auth/sign-up/schema/sign-up.schema";
import { getCurrentUser, homePath } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { consumeRateLimit } from "@/utils/rate-limit";
import { rememberOrganization, startSession } from "@/utils/session";
import { hashToken } from "@/utils/tokens";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { getLocale } from "next-intl/server";
import { headers } from "next/headers";

async function openInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { organization: { select: { id: true, name: true } } },
  });

  return invitation && !invitation.acceptedAt && invitation.expiresAt > new Date() ? invitation : null;
}

// What the invitation page needs to decide what to show. Expired and already-used links get
// their own explanation instead of one generic error.
export async function findInvitation(token: string) {
  const found = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { organization: { select: { name: true } } },
  });

  if (!found) {
    return null;
  }

  if (found.acceptedAt) {
    return { status: "used", organization: found.organization.name } as const;
  }

  if (found.expiresAt <= new Date()) {
    const inviter = await prisma.user.findUnique({ where: { id: found.invitedById }, select: { name: true, lastName: true } });
    return {
      status: "expired",
      organization: found.organization.name,
      inviter: inviter ? [inviter.name, inviter.lastName].filter(Boolean).join(" ") : "",
    } as const;
  }

  const invitation = found;
  const [user, account] = await Promise.all([
    getCurrentUser(),
    prisma.user.findUnique({ where: { email: invitation.email }, select: { id: true } }),
  ]);

  return {
    status: "open",
    organization: invitation.organization.name,
    email: invitation.email,
    name: invitation.name,
    lastName: invitation.lastName,
    // "signedIn": the right person is signed in; "otherUser": someone else is;
    // "existing": an account exists, sign in first; "new": create an account.
    state: user
      ? user.email === invitation.email
        ? "signedIn"
        : "otherUser"
      : account
        ? "existing"
        : "new",
  } as const;
}

type AcceptError = "invalidLink" | "invalidInput" | "signInFirst" | "rateLimited";

// Joins the organization, creating the account first when the person has none.
export async function acceptInvitation(
  token: string,
  data?: unknown
): Promise<{ redirectTo: string } | { error: AcceptError }> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  if (!consumeRateLimit(`invite:ip:${ip}`, 20, 60 * 60_000)) {
    return { error: "rateLimited" };
  }

  const invitation = await openInvitation(token);

  if (!invitation) {
    return { error: "invalidLink" };
  }

  let userId: string;
  let consentedAt: Date | null = null;
  const current = await getCurrentUser();

  if (current) {
    if (current.email !== invitation.email) {
      return { error: "signInFirst" };
    }

    userId = current.id;
    // The invitation reached this inbox, which confirms the address.
    if (!current.emailVerifiedAt) {
      await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
    }
  } else {
    if (await prisma.user.findUnique({ where: { email: invitation.email }, select: { id: true } })) {
      return { error: "signInFirst" };
    }

    const parsed = accountSchema.safeParse({ ...(data as object), email: invitation.email });

    if (!parsed.success) {
      return { error: "invalidInput" };
    }

    const { password, consent: _consent, ...profile } = parsed.data;
    const user = await prisma.user.create({
      data: {
        ...profile,
        id: randomUUID(),
        password: await hash(password, 10),
        locale: await getLocale(),
        emailVerifiedAt: new Date(),
      },
    });

    userId = user.id;
    consentedAt = new Date();
  }

  const membership = await prisma.$transaction(async (tx) => {
    await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });

    return tx.membership.upsert({
      where: { userId_organizationId: { userId, organizationId: invitation.organizationId } },
      create: {
        userId,
        organizationId: invitation.organizationId,
        role: invitation.role,
        teamId: invitation.teamId,
        position: invitation.position,
        consentedAt,
      },
      update: {},
      include: { organization: { select: { slug: true } } },
    });
  });

  if (!current) {
    await startSession(userId);
  }

  await rememberOrganization(membership.organization.slug);

  return { redirectTo: homePath(membership) };
}
