"use server";

import { accountSchema } from "@/app/auth/sign-up/schema/sign-up.schema";
import { getCurrentUser, homePath } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { consumeRateLimit } from "@/utils/rate-limit";
import { rememberOrganization, startSession } from "@/utils/session";
import { hashToken } from "@/utils/tokens";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { headers } from "next/headers";

async function openInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { organization: { select: { id: true, name: true } } },
  });

  return invitation && !invitation.acceptedAt && invitation.expiresAt > new Date() ? invitation : null;
}

// What the invitation page needs to decide which form to show.
export async function findInvitation(token: string) {
  const invitation = await openInvitation(token);

  if (!invitation) {
    return null;
  }

  const [user, account] = await Promise.all([
    getCurrentUser(),
    prisma.user.findUnique({ where: { email: invitation.email }, select: { id: true } }),
  ]);

  return {
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
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

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
      data: { ...profile, id: randomUUID(), password: await hash(password, 10) },
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
    });
  });

  if (!current) {
    await startSession(userId);
  }

  rememberOrganization(invitation.organizationId);

  return { redirectTo: homePath(membership) };
}
