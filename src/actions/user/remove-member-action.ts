"use server";

import { requireMember } from "@/utils/authentication";
import { audit } from "@/utils/audit";
import { prisma } from "@/utils/database";
import { eraseInOrganization } from "@/utils/erasure";
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

  await prisma.$transaction([...eraseInOrganization(id, organization.id), prisma.membership.delete({ where: { id: target.id } })]);
  await audit(organization.id, user.id, "removeMember", { subjectId: id, detail: { role: target.role } });
}
