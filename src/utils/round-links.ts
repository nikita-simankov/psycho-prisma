import "server-only";

import { prisma } from "./database";
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
