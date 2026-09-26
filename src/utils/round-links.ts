import "server-only";

import { prisma } from "./database";
import { itemHref, roundJourney } from "./round-journey";
import { can } from "./roles";
import { hashToken } from "./tokens";

// The assignment a round link opens, or null when the link has expired or the round is closed.
export async function findLinkAssignment(token: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: { select: { id: true, name: true, emailVerifiedAt: true } },
      round: { include: { organization: { select: { slug: true, name: true } } } },
    },
  });

  if (!assignment?.tokenExpiresAt || assignment.tokenExpiresAt < new Date() || assignment.round.closedAt) {
    return null;
  }

  return assignment;
}

// Opening the link proves the person reads this inbox.
export async function markLinkUserVerified(user: { id: string; emailVerifiedAt: Date | null }) {
  if (!user.emailVerifiedAt) {
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  }
}

// Where a round link lands: straight on the first unfinished item, after the privacy notice when the
// person hasn't agreed to it yet.
export async function linkDestination(assignment: { id: string; userId: string; round: { organizationId: string } }) {
  const [journey, membership] = await Promise.all([
    roundJourney(assignment.id, assignment.userId),
    prisma.membership.findFirst({
      where: { userId: assignment.userId, organizationId: assignment.round.organizationId },
      select: { role: true, consentedAt: true },
    }),
  ]);
  const target = journey?.first ? itemHref(journey.first, assignment.id) : "/assessments";
  if (membership && !membership.consentedAt && !can(membership.role, "viewDashboard")) {
    return `/consent?next=${encodeURIComponent(target)}`;
  }
  return target;
}
