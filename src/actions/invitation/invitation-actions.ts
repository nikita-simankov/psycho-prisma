"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { absoluteUrl, sendMail } from "@/utils/mail";
import { assignableRoles } from "@/utils/roles";
import { createToken } from "@/utils/tokens";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import enMessages from "../../../messages/en.json";
import ruMessages from "../../../messages/ru.json";

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

type Inviter = Awaited<ReturnType<typeof requireMember>>;

async function mailInvitation(organization: string, email: string, token: string) {
  const link = absoluteUrl(`/invite/${token}`);
  const t = await getTranslations("mail.invitation");
  const emailed = await sendMail({
    to: email,
    subject: t("subject", { organization }),
    text: t("text", { organization, link, days: INVITATION_DAYS }),
  });
  return { link, emailed };
}

async function invite({ user, membership, organization }: Inviter, data: unknown): Promise<InvitationResult> {
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

  return mailInvitation(organization.name, invitation.email, token);
}

// Creates an invitation and emails its link. The link is also returned so the
// admin can pass it on when email is not configured.
export async function createInvitation(data: unknown): Promise<InvitationResult> {
  return invite(await requireMember("manageMembers"), data);
}

const bulkRowSchema = z.object({
  email: z.string(),
  name: z.string().default(""),
  lastName: z.string().default(""),
  role: z.string().default(""),
  team: z.string().default(""),
  position: z.string().default(""),
});

export type BulkInvitationResult = {
  email: string;
  outcome: "sent" | "notEmailed" | "alreadyMember" | "invalidEmail" | "unknownRole" | "unknownTeam";
  link?: string;
};

// Invites everyone in a spreadsheet. Roles can be keys or their English or Russian names;
// teams are matched by name. Rows that can't be used are reported, not fatal.
export async function createInvitations(rows: unknown): Promise<BulkInvitationResult[]> {
  const context = await requireMember("manageMembers");
  const parsed = z.array(bulkRowSchema).max(500).parse(rows);
  const teams = await prisma.team.findMany({ where: { organizationId: context.organization.id } });
  const roles = assignableRoles(context.membership.role);
  const roleByName = new Map<string, string>();
  for (const role of roles) {
    for (const label of [role, enMessages.roles[role], ruMessages.roles[role]]) {
      roleByName.set(label.trim().toLowerCase(), role);
    }
  }

  const results: BulkInvitationResult[] = [];
  for (const row of parsed) {
    const email = row.email.trim().toLowerCase();
    if (!z.string().email().safeParse(email).success) {
      results.push({ email: row.email, outcome: "invalidEmail" });
      continue;
    }
    const role = row.role.trim() ? roleByName.get(row.role.trim().toLowerCase()) : "member";
    if (!role) {
      results.push({ email, outcome: "unknownRole" });
      continue;
    }
    const team = row.team.trim() ? teams.find((entry) => entry.name.toLowerCase() === row.team.trim().toLowerCase()) : null;
    if (team === undefined) {
      results.push({ email, outcome: "unknownTeam" });
      continue;
    }

    const result = await invite(context, {
      email,
      name: row.name,
      lastName: row.lastName,
      role,
      teamId: team?.id ?? null,
      position: row.position,
    });
    results.push(
      "error" in result
        ? { email, outcome: "alreadyMember" }
        : { email, outcome: result.emailed ? "sent" : "notEmailed", link: result.link }
    );
  }

  return results;
}

// Sends the invitation again with a new link and a fresh expiry date.
export async function resendInvitation(invitationId: unknown) {
  const { organization } = await requireMember("manageMembers");
  const invitation = await prisma.invitation.findFirstOrThrow({
    where: { id: z.string().parse(invitationId), organizationId: organization.id, acceptedAt: null },
  });
  const { token, tokenHash } = createToken();

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { tokenHash, expiresAt: new Date(Date.now() + INVITATION_DAYS * 24 * 60 * 60_000) },
  });

  return mailInvitation(organization.name, invitation.email, token);
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
