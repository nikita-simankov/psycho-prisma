import "server-only";

import { audit, AUDIT_RETENTION_MONTHS } from "./audit";
import { prisma } from "./database";
import { eraseInOrganization } from "./erasure";
import { retentionCutoff } from "./retention-rules";

// Deletes results past each organization's retention period, erases candidates whose rounds
// closed long enough ago, and drops old audit events. Runs with the hourly maintenance.
export async function runRetention(now = new Date()) {
  const organizations = await prisma.organization.findMany({
    where: { OR: [{ retentionMonths: { gt: 0 } }, { candidateRetentionMonths: { gt: 0 } }] },
    select: { id: true, retentionMonths: true, candidateRetentionMonths: true },
  });
  let results = 0;
  let candidates = 0;

  for (const organization of organizations) {
    const resultsCutoff = retentionCutoff(now, organization.retentionMonths);
    if (resultsCutoff) {
      const before = { organizationId: organization.id, createdAt: { lt: resultsCutoff } };
      const counts = await prisma.$transaction([
        prisma.testSubmission.deleteMany({ where: before }),
        prisma.formSubmission.deleteMany({ where: before }),
        prisma.reportVersion.deleteMany({ where: before }),
        prisma.draft.deleteMany({ where: { organizationId: organization.id, updatedAt: { lt: resultsCutoff } } }),
      ]);
      const deleted = counts.reduce((sum, count) => sum + count.count, 0);
      if (deleted > 0) {
        results += deleted;
        await audit(organization.id, null, "retentionCleanup", { detail: { kind: "results", deleted, before: resultsCutoff.toISOString() } });
      }
    }

    const candidatesCutoff = retentionCutoff(now, organization.candidateRetentionMonths);
    if (candidatesCutoff) {
      const expired = await expiredCandidates(organization.id, candidatesCutoff);
      for (const membership of expired) {
        await prisma.$transaction([...eraseInOrganization(membership.userId, organization.id), prisma.membership.delete({ where: { id: membership.id } })]);
        await audit(organization.id, null, "retentionCleanup", { subjectId: membership.userId, detail: { kind: "candidate" } });
      }
      candidates += expired.length;
    }
  }

  const { count: auditEvents } = await prisma.auditEvent.deleteMany({
    where: { createdAt: { lt: retentionCutoff(now, AUDIT_RETENTION_MONTHS)! } },
  });

  return { results, candidates, auditEvents };
}

// Candidates with no open round whose last round closed (or, with no rounds, who joined) before the cutoff.
async function expiredCandidates(organizationId: string, cutoff: Date) {
  const memberships = await prisma.membership.findMany({
    where: { organizationId, role: "candidate", createdAt: { lt: cutoff } },
    select: { id: true, userId: true },
  });
  if (memberships.length === 0) return [];

  const assignments = await prisma.assignment.findMany({
    where: { userId: { in: memberships.map((membership) => membership.userId) }, round: { organizationId } },
    select: { userId: true, round: { select: { closedAt: true } } },
  });

  return memberships.filter((membership) =>
    assignments
      .filter((assignment) => assignment.userId === membership.userId)
      .every((assignment) => assignment.round.closedAt !== null && assignment.round.closedAt < cutoff)
  );
}
