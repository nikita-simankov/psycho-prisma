"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { INVITATION_DAYS, invite, inviterName, mailInvitation, type InvitationResult } from "@/utils/invitations";
import { assignableRoles } from "@/utils/roles";
import { createToken } from "@/utils/tokens";
import { z } from "zod";
import enMessages from "../../../messages/en.json";
import ruMessages from "../../../messages/ru.json";

// Creates an invitation and emails its link. The link is also returned so the
// admin can pass it on when email is not configured.
export type { InvitationResult };

// Without `holdIfUnverified` an invitation is never held, it is sent or refused.
async function sendNow(context: Awaited<ReturnType<typeof requireMember>>, data: unknown): Promise<InvitationResult> {
  const result = await invite(context, data);
  if ("held" in result) {
    throw new Error("Unexpected held invitation");
  }
  return result;
}

export async function createInvitation(data: unknown): Promise<InvitationResult> {
  return sendNow(await requireMember("manageMembers"), data);
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
  outcome: "sent" | "notEmailed" | "alreadyMember" | "planSeats" | "emailUnverified" | "invalidEmail" | "unknownRole" | "unknownTeam";
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

    const result = await sendNow(context, {
      email,
      name: row.name,
      lastName: row.lastName,
      role,
      teamId: team?.id ?? null,
      position: row.position,
    });
    results.push(
      "error" in result
        ? { email, outcome: result.error }
        : { email, outcome: result.emailed ? "sent" : "notEmailed", link: result.link }
    );
  }

  return results;
}

// Sends the invitation again with a new link and a fresh expiry date.
export async function resendInvitation(invitationId: unknown) {
  const { organization, user } = await requireMember("manageMembers");
  // Held invitations go out with the email confirmation, not before.
  if (!user.emailVerifiedAt) {
    throw new Error("Confirm your email first");
  }
  const invitation = await prisma.invitation.findFirstOrThrow({
    where: { id: z.string().parse(invitationId), organizationId: organization.id, acceptedAt: null },
  });
  const { token, tokenHash } = createToken();

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { tokenHash, held: false, expiresAt: new Date(Date.now() + INVITATION_DAYS * 24 * 60 * 60_000) },
  });

  return mailInvitation({
    organization: organization.name,
    email: invitation.email,
    token,
    role: invitation.role,
    inviter: inviterName(user),
    locale: invitation.locale,
  });
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
