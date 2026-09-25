"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { memberInclude, toMember } from "@/utils/user";

export async function findAllArchiveEntries() {
  const { membership, organization } = await requireMember("viewDashboard");

  const [entries, memberships] = await Promise.all([
    prisma.userSummary.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.membership.findMany({ where: { organizationId: organization.id }, include: memberInclude }),
  ]);

  const members = new Map(memberships.map((m) => [m.userId, toMember(m, membership.role)]));

  return entries.flatMap((entry) => {
    const user = entry.userId ? members.get(entry.userId) : undefined;
    return user ? [{ ...entry, user }] : [];
  });
}

export async function findArchiveEntryByUserId(userId: string) {
  const { organization } = await requireMember("viewDashboard");

  return prisma.userSummary.findUnique({
    where: { userId_organizationId: { userId, organizationId: organization.id } },
  });
}
