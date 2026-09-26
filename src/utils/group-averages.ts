import "server-only";

import { prisma } from "./database";
import { localizedTestsAsAnswered } from "./instrument-versions";
import { groupAverages, hiddenGroups } from "./results";
import { scoreSubmission, toScaleRows } from "./scoring";
import type { Test } from "@prisma/client";

// Team and organization averages for one test, from each current member's latest result, each
// scored with the version of the test it answered.
export async function latestGroupAverages(organizationId: string, test: Test, locale: string) {
  return (await latestGroups(organizationId, test, locale)).groups;
}

// As latestGroupAverages, with the teams held back for being too small.
export async function latestGroups(organizationId: string, test: Test, locale: string) {
  const [submissions, memberships, teams] = await Promise.all([
    prisma.testSubmission.findMany({
      where: { organizationId, testId: test.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.membership.findMany({
      where: { organizationId, role: { not: "candidate" } },
      select: { userId: true, teamId: true },
    }),
    prisma.team.findMany({ where: { organizationId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const teamOf = new Map(memberships.map((member) => [member.userId, member.teamId]));
  const seen = new Set<string>();
  const latest = submissions.filter((submission) => {
    // Candidates and people who left are not part of any team picture.
    if (!teamOf.has(submission.userId) || seen.has(submission.userId)) return false;
    seen.add(submission.userId);
    return true;
  });

  const testFor = await localizedTestsAsAnswered([test], latest, locale);

  const results = latest.map((submission) => ({
    userId: submission.userId,
    teamId: teamOf.get(submission.userId) ?? null,
    rows: toScaleRows(scoreSubmission(testFor(submission) ?? test, JSON.parse(submission.submission))?.result ?? []),
  }));
  return { groups: groupAverages(results, teams), hidden: hiddenGroups(results, teams) };
}
