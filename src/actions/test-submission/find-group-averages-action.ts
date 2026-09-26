"use server";

import { requireMember } from "@/utils/authentication";
import { localizeTest } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { libraryWhere } from "@/utils/library";
import { groupAverages } from "@/utils/results";
import { can } from "@/utils/roles";
import { scoreSubmission, toScaleRows } from "@/utils/scoring";
import { getLocale } from "next-intl/server";
import { z } from "zod";

// Team and organization averages for one test, from each person's latest result.
export async function findGroupAverages(testId: unknown) {
  const { membership, organization } = await requireMember("viewDashboard");
  const test = await prisma.test.findFirst({
    where: { id: z.string().parse(testId), AND: [libraryWhere(organization.id)] },
  });

  if (!test || (test.sensitive && !can(membership.role, "viewSensitive"))) {
    return null;
  }

  const [submissions, memberships, teams, locale] = await Promise.all([
    prisma.testSubmission.findMany({
      where: { organizationId: organization.id, testId: test.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.membership.findMany({
      where: { organizationId: organization.id, role: { not: "candidate" } },
      select: { userId: true, teamId: true },
    }),
    prisma.team.findMany({ where: { organizationId: organization.id }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    getLocale(),
  ]);

  const localized = localizeTest(test, locale);
  const teamOf = new Map(memberships.map((member) => [member.userId, member.teamId]));
  const seen = new Set<string>();
  const latest = submissions.filter((submission) => {
    // Candidates and people who left are not part of any team picture.
    if (!teamOf.has(submission.userId) || seen.has(submission.userId)) return false;
    seen.add(submission.userId);
    return true;
  });

  return groupAverages(
    latest.map((submission) => ({
      userId: submission.userId,
      teamId: teamOf.get(submission.userId) ?? null,
      rows: toScaleRows(scoreSubmission(localized, JSON.parse(submission.submission))?.result ?? []),
    })),
    teams
  );
}
