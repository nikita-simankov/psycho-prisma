"use server";

import { requireMember } from "@/utils/authentication";
import { audit } from "@/utils/audit";
import { prisma } from "@/utils/database";
import { assignableRoles } from "@/utils/roles";
import { z } from "zod";

const membershipSchema = z
  .object({
    role: z.string(),
    teamId: z.string().nullable(),
    position: z.string().trim().max(200),
  })
  .partial()
  .strict();

// Role, team and position of a person in the active organization.
export async function updateMembership(userId: string, data: unknown) {
  const { membership, organization, user } = await requireMember("manageMembers");
  const changes = membershipSchema.parse(data);

  const target = await prisma.membership.findUniqueOrThrow({
    where: { userId_organizationId: { userId: z.string().parse(userId), organizationId: organization.id } },
  });

  if (target.role === "owner" && membership.role !== "owner") {
    throw new Error("Only an owner can change another owner");
  }

  if (changes.role !== undefined && changes.role !== target.role) {
    if (!assignableRoles(membership.role).includes(changes.role as never)) {
      throw new Error("You cannot give this role");
    }

    if (target.role === "owner") {
      const owners = await prisma.membership.count({ where: { organizationId: organization.id, role: "owner" } });

      if (owners <= 1) {
        throw new Error("An organization needs at least one owner");
      }
    }
  }

  if (changes.teamId) {
    await prisma.team.findFirstOrThrow({ where: { id: changes.teamId, organizationId: organization.id } });
  }

  await prisma.membership.update({ where: { id: target.id }, data: changes });
  await audit(organization.id, user.id, "changeMembership", {
    subjectId: target.userId,
    detail: { ...(changes.role !== undefined && { from: target.role, role: changes.role }), ...(changes.teamId !== undefined && { teamId: changes.teamId }) },
  });
}
