"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { memberInclude, toMember } from "@/utils/user";

// Everyone in the active organization.
export async function findAllUsers() {
  const { membership, organization } = await requireMember("viewDashboard");

  const memberships = await prisma.membership.findMany({
    where: { organizationId: organization.id },
    include: memberInclude,
    orderBy: [{ user: { lastName: "asc" } }, { user: { name: "asc" } }],
  });

  return memberships.map((m) => toMember(m, membership.role));
}

// The given people, if they are in the active organization.
export async function findUsersByIds(userIds: string[]) {
  const { membership, organization } = await requireMember("viewDashboard");

  const memberships = await prisma.membership.findMany({
    where: { organizationId: organization.id, userId: { in: userIds } },
    include: memberInclude,
  });

  return memberships.map((m) => toMember(m, membership.role));
}
