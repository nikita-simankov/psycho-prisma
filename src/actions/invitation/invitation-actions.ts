"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { INVITATION_DAYS, invite, inviterName, mailInvitation, type InvitationResult } from "@/utils/invitations";
import { assignableRoles, STAFF_ROLES } from "@/utils/roles";
import { staffSeats } from "@/utils/billing";
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

type BulkOutcome =
  | "sent"
  | "notEmailed"
  | "alreadyMember"
  | "planSeats"
  | "emailUnverified"
  | "invalidEmail"
  | "unknownRole"
  | "unknownTeam"
  | "duplicate";

export type BulkInvitationResult = { email: string; outcome: BulkOutcome; link?: string };

// What the import preview shows for a row before anything is sent.
export type PreviewOutcome = "ready" | "newTeam" | "reinvite" | Exclude<BulkOutcome, "sent" | "notEmailed" | "emailUnverified">;
export type PreviewRow = { email: string; name: string; role: string; team: string; outcome: PreviewOutcome };

// Roles can be keys or their English or Russian names.
function roleLookup(role: string) {
  const roleByName = new Map<string, string>();
  for (const entry of assignableRoles(role)) {
    for (const label of [entry, enMessages.roles[entry], ruMessages.roles[entry]]) {
      roleByName.set(label.trim().toLowerCase(), entry);
    }
  }
  return (value: string) => (value.trim() ? roleByName.get(value.trim().toLowerCase()) : "member");
}

// Checks every row of a spreadsheet without sending anything, so the admin sees the problems
// first. Rows are marked in order, so the seat limit falls on the last staff rows.
export async function previewInvitations(rows: unknown, options: unknown): Promise<PreviewRow[]> {
  const { organization, membership } = await requireMember("manageMembers");
  const parsed = z.array(bulkRowSchema).max(500).parse(rows);
  const { createTeams } = z.object({ createTeams: z.boolean().default(false) }).parse(options ?? {});
  const [teams, members, open, seats] = await Promise.all([
    prisma.team.findMany({ where: { organizationId: organization.id }, select: { name: true } }),
    prisma.membership.findMany({ where: { organizationId: organization.id }, select: { user: { select: { email: true } } } }),
    prisma.invitation.findMany({ where: { organizationId: organization.id, acceptedAt: null }, select: { email: true } }),
    staffSeats(organization.id),
  ]);
  const teamNames = new Set(teams.map((team) => team.name.toLowerCase()));
  const memberEmails = new Set(members.map((member) => member.user.email?.toLowerCase()));
  const openEmails = new Set(open.map((invitation) => invitation.email));
  const resolveRole = roleLookup(membership.role);
  const seen = new Set<string>();
  let seatsLeft = seats.limit === null ? Infinity : seats.limit - seats.used;

  return parsed.map((row) => {
    const email = row.email.trim().toLowerCase();
    const role = resolveRole(row.role);
    const team = row.team.trim();
    const base = { email: email || row.email, name: [row.name, row.lastName].filter(Boolean).join(" "), role: role ?? row.role, team };
    const outcome = ((): PreviewOutcome => {
      if (!z.string().email().safeParse(email).success) return "invalidEmail";
      if (seen.has(email)) return "duplicate";
      seen.add(email);
      if (!role) return "unknownRole";
      if (memberEmails.has(email)) return "alreadyMember";
      if (team && !teamNames.has(team.toLowerCase()) && !createTeams) return "unknownTeam";
      if ((STAFF_ROLES as readonly string[]).includes(role)) {
        // A replaced staff invitation already holds its seat.
        if (!openEmails.has(email)) {
          if (seatsLeft <= 0) return "planSeats";
          seatsLeft -= 1;
        }
      }
      if (openEmails.has(email)) return "reinvite";
      return team && !teamNames.has(team.toLowerCase()) ? "newTeam" : "ready";
    })();
    return { ...base, outcome };
  });
}

// Invites everyone in a spreadsheet. Teams are matched by name and, with `createTeams`, created
// when missing. Rows that can't be used are reported, not fatal. The dialog sends rows in small
// batches to show progress.
export async function createInvitations(rows: unknown, options?: unknown): Promise<BulkInvitationResult[]> {
  const context = await requireMember("manageMembers");
  const parsed = z.array(bulkRowSchema).max(500).parse(rows);
  const { createTeams } = z.object({ createTeams: z.boolean().default(false) }).parse(options ?? {});
  const teams = await prisma.team.findMany({ where: { organizationId: context.organization.id } });
  const resolveRole = roleLookup(context.membership.role);

  const results: BulkInvitationResult[] = [];
  for (const row of parsed) {
    const email = row.email.trim().toLowerCase();
    if (!z.string().email().safeParse(email).success) {
      results.push({ email: row.email, outcome: "invalidEmail" });
      continue;
    }
    const role = resolveRole(row.role);
    if (!role) {
      results.push({ email, outcome: "unknownRole" });
      continue;
    }
    const teamName = row.team.trim();
    let team = teamName ? teams.find((entry) => entry.name.toLowerCase() === teamName.toLowerCase()) : null;
    if (team === undefined && createTeams) {
      team = await prisma.team.create({ data: { name: teamName.slice(0, 100), organizationId: context.organization.id } });
      teams.push(team);
    }
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

const panelSchema = z.object({
  emails: z.array(z.string()).min(1).max(50),
  role: z.string(),
  teamId: z.string().nullable().default(null),
  locale: z.string().optional(),
});

// The invite panel: several addresses with one role and team.
export async function inviteEmails(data: unknown): Promise<BulkInvitationResult[]> {
  const context = await requireMember("manageMembers");
  const { emails, ...shared } = panelSchema.parse(data);
  const results: BulkInvitationResult[] = [];

  for (const raw of Array.from(new Set(emails.map((email) => email.trim().toLowerCase())))) {
    if (!z.string().email().safeParse(raw).success) {
      results.push({ email: raw, outcome: "invalidEmail" });
      continue;
    }
    const result = await sendNow(context, { ...shared, email: raw });
    results.push(
      "error" in result
        ? { email: raw, outcome: result.error }
        : { email: raw, outcome: result.emailed ? "sent" : "notEmailed", link: result.link }
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
    data: { tokenHash, held: false, previousTokenHash: null, sentAt: new Date(), remindersSent: 0, expiresAt: new Date(Date.now() + INVITATION_DAYS * 24 * 60 * 60_000) },
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

  const invitation = await prisma.invitation.findFirst({ where: { id: invitationId, organizationId: organization.id } });
  if (!invitation) {
    return;
  }
  // They no longer get the rounds they were added to while invited.
  await prisma.$transaction([
    prisma.roundInvitee.deleteMany({ where: { email: invitation.email, round: { organizationId: organization.id } } }),
    prisma.invitation.delete({ where: { id: invitation.id } }),
  ]);
}
