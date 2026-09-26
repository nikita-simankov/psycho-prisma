import "server-only";

import { prisma } from "./database";
import { PUBLIC_INSTRUMENTS } from "./public-instruments";
import { STAFF_ROLES } from "./roles";

// Answers to the first /start question: what the organization will use Calibre for.
export const GOALS = ["development", "hiring", "wellbeing"] as const;
export type Goal = (typeof GOALS)[number];
export const TEAM_SIZES = ["1-50", "51-200", "201-1000", "1000+"] as const;

export function isGoal(value: string): value is Goal {
  return (GOALS as readonly string[]).includes(value);
}

const TESTS = {
  analogies: "3f57e760-9261-4d7c-8154-635bf0b4dc4e",
  arithmetic: "6f43dd54-388b-4088-9a0c-ad8f49d23031",
  patterns: "41742e8f-a9c2-4427-a9b1-b249ca30cc74",
  communication: "f80c5f1e-6ca0-4c2b-bb98-50d3275f4c43",
  leadership: "a4d5d8eb-76e1-4ced-b534-5cbee4b5f8c2",
  risk: "9c2d7121-afce-4125-8895-4779d9e03ea8",
  // Clinical screens: only psychologists and owners can send them or read the results.
  mentalStates: "9c1fb2c2-4a52-4c7f-b34f-4f07a7ef7723",
  selfEsteem: "dcc97f00-dde5-4a46-82a8-2e33726c4843",
};

// Tests from the shared library suggested for each goal, first the one to try yourself.
export const SUGGESTED_TESTS: Record<Goal, string[]> = {
  development: [TESTS.leadership, TESTS.communication, TESTS.risk],
  hiring: [TESTS.analogies, TESTS.arithmetic, TESTS.patterns],
  wellbeing: [TESTS.communication, TESTS.mentalStates, TESTS.selfEsteem],
};

// Minutes to plan for a test, when it is known.
export function testMinutes(testId: string) {
  return PUBLIC_INSTRUMENTS.find((instrument) => instrument.testId === testId)?.minutes ?? null;
}

export const SETUP_STEPS = ["confirmEmail", "tryYourself", "privacyContact", "inviteColleague", "addPeople", "sendRound"] as const;
export type SetupStep = (typeof SETUP_STEPS)[number];

// Which setup steps are done. Each is read from real work, so the checklist ticks itself off.
export async function setupProgress(
  organization: { id: string; privacyContact: string },
  user: { id: string; emailVerifiedAt: Date | null }
): Promise<Record<SetupStep, boolean>> {
  const organizationId = organization.id;
  const [ownTests, ownForms, staff, staffInvitations, people, peopleInvitations, rounds] = await Promise.all([
    prisma.testSubmission.count({ where: { organizationId, userId: user.id } }),
    prisma.formSubmission.count({ where: { organizationId, userId: user.id } }),
    prisma.membership.count({ where: { organizationId, role: { in: [...STAFF_ROLES] }, NOT: { userId: user.id } } }),
    prisma.invitation.count({ where: { organizationId, role: { in: [...STAFF_ROLES] } } }),
    prisma.membership.count({ where: { organizationId, role: { in: ["member", "candidate"] } } }),
    prisma.invitation.count({ where: { organizationId, role: "member" } }),
    prisma.round.count({ where: { organizationId, assignments: { some: { NOT: { userId: user.id } } } } }),
  ]);

  return {
    confirmEmail: !!user.emailVerifiedAt,
    tryYourself: ownTests + ownForms > 0,
    privacyContact: organization.privacyContact.trim() !== "",
    inviteColleague: staff + staffInvitations > 0,
    addPeople: people + peopleInvitations > 0,
    sendRound: rounds > 0,
  };
}
