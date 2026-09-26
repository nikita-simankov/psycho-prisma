import "server-only";

import { findUserById } from "@/actions/user/find-user-by-id-action";
import { ensureMember } from "@/utils/authentication";
import { localizeTest } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { allowedSubmissionWhere, libraryWhere } from "@/utils/library";
import { buildTestResult } from "@/utils/results";
import { getLocale } from "next-intl/server";

// A person's test results for their report, oldest first, with the round each answered.
// Pass submission ids to rebuild exactly what a saved version covered.
export async function loadReport(userId: string, submissionIds?: string[]) {
  const context = await ensureMember("viewIndividualResults");
  const organizationId = context.organization.id;
  const locale = await getLocale();

  const [user, submissions, draft, versions] = await Promise.all([
    findUserById(userId),
    prisma.testSubmission.findMany({
      where: {
        AND: [await allowedSubmissionWhere(context), { userId }, submissionIds ? { id: { in: submissionIds } } : {}],
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userSummary.findUnique({ where: { userId_organizationId: { userId, organizationId } } }),
    prisma.reportVersion.findMany({ where: { organizationId, userId }, orderBy: { version: "desc" } }),
  ]);

  const [tests, assignments] = await Promise.all([
    prisma.test.findMany({
      where: { id: { in: submissions.map((submission) => submission.testId) }, AND: [libraryWhere(organizationId)] },
    }),
    prisma.assignment.findMany({
      where: { id: { in: submissions.flatMap((submission) => (submission.assignmentId ? [submission.assignmentId] : [])) } },
      include: { round: { select: { id: true, name: true } } },
    }),
  ]);

  const testsById = new Map(tests.map((test) => [test.id, localizeTest(test, locale)]));
  const roundByAssignment = new Map(assignments.map((assignment) => [assignment.id, assignment.round]));
  const results = submissions.flatMap((submission) => {
    const test = testsById.get(submission.testId);
    return test
      ? [{ ...buildTestResult(test, submission), round: submission.assignmentId ? roundByAssignment.get(submission.assignmentId) ?? null : null }]
      : [];
  });

  const rounds = Array.from(
    new Map(results.flatMap((result) => (result.round ? [[result.round.id, result.round.name] as const] : []))).values()
  );

  return { context, user, results, rounds, draft, versions };
}
