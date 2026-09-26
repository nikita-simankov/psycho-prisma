import "server-only";

import { prisma } from "./database";

// Tests whose results respondents in this organization may see for themselves.
export async function feedbackTestIds(organizationId: string): Promise<Set<string>> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { respondentFeedback: true, feedbackTestIds: true },
  });

  if (!organization?.respondentFeedback) return new Set();

  const ids = JSON.parse(organization.feedbackTestIds) as string[];
  const allowed = await prisma.test.findMany({ where: { id: { in: ids }, sensitive: false }, select: { id: true } });
  return new Set(allowed.map((test) => test.id));
}
