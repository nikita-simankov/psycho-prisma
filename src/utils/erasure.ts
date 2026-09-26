import "server-only";

import { prisma } from "./database";

// Everything a person left in one organization: answers, drafts, reports, round assignments,
// saved views and work details. Their account and other organizations are untouched.
// Returned so callers can add the membership removal to the same transaction.
export function eraseInOrganization(userId: string, organizationId: string) {
  const scope = { userId, organizationId };
  return [
    prisma.testSubmission.deleteMany({ where: scope }),
    prisma.formSubmission.deleteMany({ where: scope }),
    prisma.draft.deleteMany({ where: scope }),
    prisma.userSummary.deleteMany({ where: scope }),
    prisma.reportVersion.deleteMany({ where: scope }),
    prisma.analyticsView.deleteMany({ where: scope }),
    prisma.assignment.deleteMany({ where: { userId, round: { organizationId } } }),
    // Nobody keeps pointing at them as their manager.
    prisma.membership.updateMany({ where: { organizationId, managerId: userId }, data: { managerId: null } }),
  ];
}
