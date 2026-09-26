"use server";

import { accountSchema } from "@/app/auth/sign-up/schema/sign-up.schema";
import { audit } from "@/utils/audit";
import { getCurrentUser, homePath, requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { sendVerificationEmail } from "@/utils/email-verification";
import { findJoinLink, JOIN_LINK_DAYS, joinLinkStatus, joinWithLink, newJoinToken } from "@/utils/join-links";
import { absoluteUrl } from "@/utils/mail";
import { consumeRateLimit } from "@/utils/rate-limit";
import { rememberOrganization, startSession } from "@/utils/session";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { z } from "zod";

const DAY = 24 * 60 * 60_000;

export async function findJoinLinks() {
  const { organization } = await requireMember("manageMembers");
  const links = await prisma.joinLink.findMany({
    where: { organizationId: organization.id, revokedAt: null },
    include: { team: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    links.map(async (link) => ({
      id: link.id,
      url: await absoluteUrl(`/join/${link.token}`),
      team: link.team?.name ?? null,
      expiresAt: link.expiresAt,
      maxUses: link.maxUses,
      uses: link.uses,
      status: joinLinkStatus(link),
    }))
  );
}

const createSchema = z.object({
  days: z.number().int().refine((days) => (JOIN_LINK_DAYS as readonly number[]).includes(days)),
  maxUses: z.number().int().min(1).max(10_000).nullable(),
  teamId: z.string().nullable(),
});

// A link that lets anyone who has it join as an employee. It never grants a staff role.
export async function createJoinLink(data: unknown) {
  const { organization, user } = await requireMember("manageMembers");
  const input = createSchema.parse(data);
  if (input.teamId) {
    await prisma.team.findFirstOrThrow({ where: { id: input.teamId, organizationId: organization.id } });
  }

  const link = await prisma.joinLink.create({
    data: {
      organizationId: organization.id,
      token: newJoinToken(),
      teamId: input.teamId,
      maxUses: input.maxUses,
      expiresAt: new Date(Date.now() + input.days * DAY),
      createdById: user.id,
    },
  });
  await audit(organization.id, user.id, "createJoinLink", { detail: { days: input.days, maxUses: input.maxUses } });

  return { url: await absoluteUrl(`/join/${link.token}`) };
}

export async function revokeJoinLink(linkId: unknown) {
  const { organization, user } = await requireMember("manageMembers");
  await prisma.joinLink.updateMany({
    where: { id: z.string().parse(linkId), organizationId: organization.id },
    data: { revokedAt: new Date() },
  });
  await audit(organization.id, user.id, "revokeJoinLink");
}

type JoinError = "invalidLink" | "invalidInput" | "signInFirst" | "rateLimited";

// Joins through a link, creating the account first when the person isn't signed in. Accounts
// made here still confirm their email, since anyone can type any address.
export async function joinOrganization(token: string, data?: unknown): Promise<{ redirectTo: string } | { error: JoinError }> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!consumeRateLimit(`join:ip:${ip}`, 20, 60 * 60_000)) {
    return { error: "rateLimited" };
  }

  const link = await findJoinLink(z.string().max(100).parse(token));
  if (!link || joinLinkStatus(link) !== "open") {
    return { error: "invalidLink" };
  }

  const current = await getCurrentUser();
  let userId = current?.id;
  let created: { id: string; email: string | null } | null = null;

  if (!userId) {
    const parsed = accountSchema.safeParse(data);
    if (!parsed.success) {
      return { error: "invalidInput" };
    }
    const { password, consent: _consent, ...profile } = parsed.data;
    if (await prisma.user.findUnique({ where: { email: profile.email }, select: { id: true } })) {
      return { error: "signInFirst" };
    }
    created = await prisma.user.create({
      data: { ...profile, id: randomUUID(), password: await hash(password, 10), locale: await getLocale() },
      select: { id: true, email: true },
    });
    userId = created.id;
  }

  if (!(await joinWithLink(link.id, userId))) {
    return { error: "invalidLink" };
  }

  if (created) {
    await sendVerificationEmail(created);
    await startSession(created.id);
  }
  await rememberOrganization(link.organization.slug);

  const membership = await prisma.membership.findUniqueOrThrow({
    where: { userId_organizationId: { userId, organizationId: link.organizationId } },
    select: { role: true, organization: { select: { slug: true } } },
  });
  return { redirectTo: homePath(membership) };
}
