"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { absoluteUrl, sendMail } from "@/utils/mail";
import { assignableRoles } from "@/utils/roles";
import { createToken } from "@/utils/tokens";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

const INVITATION_DAYS = 14;

const invitationSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().max(100).default(""),
  lastName: z.string().trim().max(100).default(""),
  role: z.string(),
  teamId: z.string().nullable().default(null),
  position: z.string().trim().max(200).default(""),
});

export type InvitationResult = { link: string; emailed: boolean } | { error: "alreadyMember" };

// Creates an invitation and emails its link. The link is also returned so the
// admin can pass it on when email is not configured.
export async function createInvitation(data: unknown): Promise<InvitationResult> {
  const { user, membership, organization } = await requireMember("manageMembers");
  const invitation = invitationSchema.parse(data);

  if (!assignableRoles(membership.role).includes(invitation.role as never)) {
    throw new Error("You cannot give this role");
  }

  if (invitation.teamId) {
    await prisma.team.findFirstOrThrow({ where: { id: invitation.teamId, organizationId: organization.id } });
  }

  const existing = await prisma.membership.findFirst({
    where: { organizationId: organization.id, user: { email: invitation.email } },
  });

  if (existing) {
    return { error: "alreadyMember" };
  }

  // A new invitation replaces any open one for the same address.
  await prisma.invitation.deleteMany({
    where: { organizationId: organization.id, email: invitation.email, acceptedAt: null },
  });

  const { token, tokenHash } = createToken();

  await prisma.invitation.create({
    data: {
      ...invitation,
      tokenHash,
      organizationId: organization.id,
      invitedById: user.id,
      expiresAt: new Date(Date.now() + INVITATION_DAYS * 24 * 60 * 60_000),
    },
  });

  const link = absoluteUrl(`/invite/${token}`);
  const t = await getTranslations("mail.invitation");
  const emailed = await sendMail({
    to: invitation.email,
    subject: t("subject", { organization: organization.name }),
    text: t("text", { organization: organization.name, link, days: INVITATION_DAYS }),
  });

  return { link, emailed };
}

export async function findOpenInvitations() {
  const { organization } = await requireMember("manageMembers");

  return prisma.invitation.findMany({
    where: { organizationId: organization.id, acceptedAt: null },
    include: { team: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeInvitation(invitationId: string) {
  const { organization } = await requireMember("manageMembers");

  await prisma.invitation.deleteMany({ where: { id: invitationId, organizationId: organization.id } });
}
