"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { z } from "zod";

// Removes a person from the active organization together with everything they
// submitted there. Their account and other organizations are untouched.
export async function removeMember(userId: string) {
  const { user, membership, organization } = await requireMember("manageMembers");
  const id = z.string().parse(userId);

  if (id === user.id) {
    throw new Error("You cannot remove yourself");
  }

  const target = await prisma.membership.findUniqueOrThrow({
    where: { userId_organizationId: { userId: id, organizationId: organization.id } },
  });

  if (target.role === "owner" && membership.role !== "owner") {
    throw new Error("Only an owner can remove an owner");
  }

  const scope = { userId: id, organizationId: organization.id };

  await prisma.$transaction([
    prisma.testSubmission.deleteMany({ where: scope }),
    prisma.formSubmission.deleteMany({ where: scope }),
    prisma.userSummary.deleteMany({ where: scope }),
    prisma.membership.delete({ where: { id: target.id } }),
  ]);
}
