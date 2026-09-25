"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { z } from "zod";

const nameSchema = z.string().trim().min(1).max(100);

export async function findAllTeams() {
  const { organization } = await requireMember("viewDashboard");

  return prisma.team.findMany({
    where: { organizationId: organization.id },
    include: { _count: { select: { memberships: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createTeam(name: string) {
  const { organization } = await requireMember("manageMembers");

  return prisma.team.create({ data: { name: nameSchema.parse(name), organizationId: organization.id } });
}

export async function renameTeam(teamId: string, name: string) {
  const { organization } = await requireMember("manageMembers");

  await prisma.team.updateMany({
    where: { id: teamId, organizationId: organization.id },
    data: { name: nameSchema.parse(name) },
  });
}

// People in the team stay in the organization without a team.
export async function deleteTeam(teamId: string) {
  const { organization } = await requireMember("manageMembers");

  await prisma.team.deleteMany({ where: { id: teamId, organizationId: organization.id } });
}
