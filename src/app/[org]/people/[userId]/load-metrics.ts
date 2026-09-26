import "server-only";

import type { Context } from "@/utils/authentication";
import { localizeTest } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { latestGroupAverages } from "@/utils/group-averages";
import { allowedSubmissionWhere, libraryWhere } from "@/utils/library";
import { completionRate, scaleTrends } from "@/utils/metrics";
import { buildTestResult, type GroupAverage } from "@/utils/results";
import { can } from "@/utils/roles";
import type { ScaleRow } from "@/utils/scoring";
import { getLocale } from "next-intl/server";

export type TestMetrics = {
  testId: string;
  testName: string;
  count: number;
  latestAt: Date;
  latest: ScaleRow[];
  trends: ReturnType<typeof scaleTrends>;
  team: GroupAverage | null;
  everyone: GroupAverage | null;
};

// What a person's page shows about their participation and, for roles that see individual
// results, how their scores moved and compare with their team and the organization.
export async function loadPersonMetrics(context: Context, userId: string, teamId: string | null) {
  const organizationId = context.organization.id;
  const sensitive = can(context.membership.role, "viewSensitive")
    ? []
    : (await prisma.test.findMany({ where: { sensitive: true }, select: { id: true } })).map((test) => test.id);

  const [assignments, last] = await Promise.all([
    prisma.assignment.findMany({
      where: { userId, round: { organizationId } },
      select: { completedAt: true, round: { select: { closedAt: true, dueAt: true } } },
    }),
    // Only the date, which roles limited to averages may see too.
    prisma.testSubmission.findFirst({
      where: { organizationId, userId, testId: { notIn: sensitive } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const summary = { completion: completionRate(assignments), lastAssessed: last?.createdAt ?? null };

  if (!can(context.membership.role, "viewIndividualResults")) {
    return { ...summary, tests: [] as TestMetrics[] };
  }

  const locale = await getLocale();
  const submissions = await prisma.testSubmission.findMany({
    where: { AND: [await allowedSubmissionWhere(context), { userId }] },
    orderBy: { createdAt: "asc" },
  });
  const tests = await prisma.test.findMany({
    where: { id: { in: Array.from(new Set(submissions.map((submission) => submission.testId))) }, AND: [libraryWhere(organizationId)] },
  });

  const metrics = await Promise.all(
    tests.map(async (row): Promise<TestMetrics | null> => {
      const test = localizeTest(row, locale);
      const results = submissions
        .filter((submission) => submission.testId === test.id)
        .map((submission) => buildTestResult(test, submission));
      const latest = results[results.length - 1];
      if (!latest) return null;

      const groups = await latestGroupAverages(organizationId, test);
      return {
        testId: test.id,
        testName: test.name,
        count: results.length,
        latestAt: latest.createdAt,
        latest: latest.rows,
        trends: scaleTrends(results),
        team: (teamId && groups.find((group) => group.key === teamId)) || null,
        everyone: groups.find((group) => group.key === "all") ?? null,
      };
    })
  );

  return {
    ...summary,
    // Most recently taken first.
    tests: metrics
      .filter((entry): entry is TestMetrics => entry !== null)
      .sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime()),
  };
}
