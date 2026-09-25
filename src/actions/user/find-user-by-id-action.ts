"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { memberInclude, toMember } from "@/utils/user";

// A person in the active organization, or null if they are not in it.
export async function findUserById(userId: string) {
  const { membership, organization } = await requireMember("viewDashboard");

  const found = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: organization.id } },
    include: memberInclude,
  });

  return found && toMember(found, membership.role);
}
