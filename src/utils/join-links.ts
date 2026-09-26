import "server-only";

import { randomBytes } from "crypto";
import { prisma } from "./database";

// How long a new join link works, in days.
export const JOIN_LINK_DAYS = [7, 30, 90] as const;

export function newJoinToken() {
  return randomBytes(18).toString("base64url");
}

type JoinLinkRow = { expiresAt: Date; revokedAt: Date | null; maxUses: number | null; uses: number };

export function joinLinkStatus(link: JoinLinkRow, now = new Date()) {
  if (link.revokedAt) return "revoked" as const;
  if (link.expiresAt <= now) return "expired" as const;
  if (link.maxUses !== null && link.uses >= link.maxUses) return "full" as const;
  return "open" as const;
}

export function findJoinLink(token: string) {
  return prisma.joinLink.findUnique({
    where: { token },
    include: { organization: { select: { id: true, name: true, slug: true } } },
  });
}

// Adds the person as an employee. The use is counted in the same step that checks the limit, so
// two people can't both take the last place. Returns false when the link can't be used any more.
export async function joinWithLink(linkId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const link = await tx.joinLink.findUniqueOrThrow({ where: { id: linkId } });
    const existing = await tx.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: link.organizationId } },
    });
    if (existing) {
      return true;
    }
    if (joinLinkStatus(link) !== "open") {
      return false;
    }
    const claimed = await tx.joinLink.updateMany({
      where: { id: link.id, uses: link.uses },
      data: { uses: { increment: 1 } },
    });
    if (!claimed.count) {
      return false;
    }
    await tx.membership.create({
      data: { userId, organizationId: link.organizationId, role: "member", teamId: link.teamId, consentedAt: new Date() },
    });
    return true;
  });
}
