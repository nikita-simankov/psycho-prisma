"use server";

import { homePath, requireFullSession, requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { invite } from "@/utils/invitations";
import { GOALS, TEAM_SIZES } from "@/utils/onboarding";
import { createSampleWorkspace, deleteSampleWorkspace } from "@/utils/sample-workspace";
import { rememberOrganization } from "@/utils/session";
import { z } from "zod";

// Step 1 of /start: what Calibre is for here, and roughly how many people.
export async function saveStartAnswers(data: unknown) {
  const { organization } = await requireMember("manageSettings");
  const { goal, teamSize } = z.object({ goal: z.enum(GOALS), teamSize: z.enum(TEAM_SIZES) }).parse(data);
  await prisma.organization.update({ where: { id: organization.id }, data: { goal, teamSize } });
  return { ok: true as const };
}

const colleagueSchema = z.array(z.object({ email: z.string(), role: z.string() })).max(5);

export type ColleagueOutcome = { email: string; outcome: "sent" | "notEmailed" | "held" | "alreadyMember" | "planSeats" | "invalidEmail" };

// Step 2 of /start: invite a few colleagues. Before the owner confirms their email the
// invitations are saved and go out with the confirmation (src/utils/email-verification.ts).
export async function inviteColleagues(rows: unknown): Promise<ColleagueOutcome[]> {
  const context = await requireMember("manageMembers");
  const outcomes: ColleagueOutcome[] = [];

  for (const row of colleagueSchema.parse(rows)) {
    const email = row.email.trim().toLowerCase();
    if (!email) continue;
    if (!z.string().email().safeParse(email).success) {
      outcomes.push({ email, outcome: "invalidEmail" });
      continue;
    }
    const result = await invite(context, { email, role: row.role }, { holdIfUnverified: true });
    outcomes.push({
      email,
      outcome: "held" in result ? "held" : "error" in result ? (result.error === "emailUnverified" ? "held" : result.error) : result.emailed ? "sent" : "notEmailed",
    });
  }

  return outcomes;
}

// Opens the sample workspace, creating it the first time.
export async function openSampleWorkspace(): Promise<{ slug: string }> {
  const user = await requireFullSession();
  const existing = await prisma.membership.findFirst({
    where: { userId: user.id, organization: { isSample: true } },
    include: { organization: { select: { slug: true } } },
  });
  const slug = existing?.organization.slug ?? (await createSampleWorkspace(user.id)).slug;
  await rememberOrganization(slug);
  return { slug };
}

// Deletes the sample workspace the signed-in owner is looking at.
export async function removeSampleWorkspace(): Promise<{ redirectTo: string }> {
  const { organization, membership, memberships } = await requireMember("manageSettings");
  const sample = await prisma.organization.findUniqueOrThrow({ where: { id: organization.id }, select: { isSample: true } });
  if (!sample.isSample || membership.role !== "owner") {
    throw new Error("Only a sample workspace can be removed here");
  }
  await deleteSampleWorkspace(organization.id);
  const other = memberships.find((m) => m.organizationId !== organization.id);
  if (other) {
    await rememberOrganization(other.organization.slug);
  }
  return { redirectTo: other ? homePath(other) : "/organizations/new" };
}

// Hides the setup checklist on Today for everyone in the organization.
export async function dismissSetup() {
  const { organization } = await requireMember("manageSettings");
  await prisma.organization.update({ where: { id: organization.id }, data: { setupDismissedAt: new Date() } });
}

// Closes the card that explains the person's role.
export async function dismissWelcome() {
  const { membership } = await requireMember("viewDashboard");
  await prisma.membership.update({ where: { id: membership.id }, data: { welcomedAt: new Date() } });
}
