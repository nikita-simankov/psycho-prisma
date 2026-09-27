"use server";

import { requireMember } from "@/utils/authentication";
import { audit } from "@/utils/audit";
import { prisma } from "@/utils/database";
import { buildDigest } from "@/utils/digest";
import { can } from "@/utils/roles";
import { ACTION_STATUSES } from "@/utils/wellbeing";
import { getLocale } from "next-intl/server";
import { z } from "zod";

const actionSchema = z
  .object({
    roundId: z.string().nullable(),
    // Null for the whole organization.
    teamId: z.string().nullable(),
    text: z.string().trim().min(1).max(280),
    status: z.enum(ACTION_STATUSES),
  })
  .strict();

// "You said, we did": records what staff do about a pulse round's results, for a team or everyone.
export async function createTeamAction(data: unknown) {
  const { organization, user } = await requireMember("manageRounds");
  const input = actionSchema.parse(data);
  const [round, team] = await Promise.all([
    input.roundId ? prisma.round.findFirstOrThrow({ where: { id: input.roundId, organizationId: organization.id }, select: { id: true } }) : null,
    input.teamId ? prisma.team.findFirstOrThrow({ where: { id: input.teamId, organizationId: organization.id }, select: { id: true } }) : null,
  ]);
  const action = await prisma.teamAction.create({
    data: { organizationId: organization.id, roundId: round?.id ?? null, teamId: team?.id ?? null, text: input.text, status: input.status, createdById: user.id },
  });
  return { id: action.id };
}

export async function updateTeamAction(actionId: unknown, data: unknown) {
  const { organization } = await requireMember("manageRounds");
  const input = z.object({ text: z.string().trim().min(1).max(280), status: z.enum(ACTION_STATUSES) }).partial().strict().parse(data);
  const { count } = await prisma.teamAction.updateMany({ where: { id: z.string().parse(actionId), organizationId: organization.id }, data: input });
  if (!count) throw new Error("Not found");
}

export async function deleteTeamAction(actionId: unknown) {
  const { organization } = await requireMember("manageRounds");
  await prisma.teamAction.deleteMany({ where: { id: z.string().parse(actionId), organizationId: organization.id } });
}

// Marks an early warning as handled. Alerts on clinical screens need viewSensitive.
export async function resolveWellbeingAlert(alertId: unknown) {
  const { organization, user, membership } = await requireMember("viewWellbeing");
  const sensitive = can(membership.role, "viewSensitive");
  const { count } = await prisma.wellbeingAlert.updateMany({
    where: { id: z.string().parse(alertId), organizationId: organization.id, resolvedAt: null, ...(!sensitive && { sensitive: false }) },
    data: { resolvedAt: new Date(), resolvedById: user.id },
  });
  if (!count) throw new Error("Not found");
}

// Marks a care follow-up as done.
export async function resolveCareFlag(flagId: unknown) {
  const { organization, user } = await requireMember("viewSensitive");
  const flag = await prisma.careFlag.findFirstOrThrow({ where: { id: z.string().parse(flagId), organizationId: organization.id, resolvedAt: null } });
  await prisma.careFlag.update({ where: { id: flag.id }, data: { resolvedAt: new Date(), resolvedById: user.id } });
  await audit(organization.id, user.id, "resolveCareFlag", { subjectId: flag.userId });
}

// This week's leadership digest as the person previewing it would receive it.
export async function previewDigest() {
  const { organization, user, membership } = await requireMember("manageSettings");
  const { email } = await buildDigest(organization, { name: user.name, locale: await getLocale(), role: membership.role });
  return { subject: email.subject, html: email.html };
}
