import "server-only";

import type { Test } from "@prisma/client";
import { prisma } from "./database";
import { testsAsAnswered } from "./instrument-versions";
import { computeOrgNorms, type OrgNorms } from "./norms";
import { scoreSubmission, toScaleRows } from "./scoring";

// The organization's own norms for a test: raw-score mean and spread per scale over everyone
// who has taken it here (each person's latest result, candidates included), each scored with
// the version they answered. See computeOrgNorms for the minimum sample.
export async function loadOrgNorms(organizationId: string, test: Test): Promise<OrgNorms> {
  const submissions = await prisma.testSubmission.findMany({
    where: { organizationId, testId: test.id },
    orderBy: { createdAt: "desc" },
    select: { userId: true, testId: true, testVersion: true, submission: true },
  });
  const seen = new Set<string>();
  const latest = submissions.filter((submission) => !seen.has(submission.userId) && seen.add(submission.userId));
  const testFor = await testsAsAnswered([test], latest);

  return computeOrgNorms(
    latest.map((submission) => toScaleRows(scoreSubmission(testFor(submission) ?? test, JSON.parse(submission.submission))?.result ?? []))
  );
}
