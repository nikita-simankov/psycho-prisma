"use server";

import { requireMember } from "@/utils/authentication";
import { audit } from "@/utils/audit";
import { prisma } from "@/utils/database";
import { FLAGS } from "@/utils/flags";
import { z } from "zod";

// Restricted follow-up flag; only roles that may see sensitive results can set it.
export async function updateFlag(userId: string, flag: string) {
  const { organization, user } = await requireMember("viewSensitive");
  const id = z.string().parse(userId);

  await prisma.membership.update({
    where: { userId_organizationId: { userId: id, organizationId: organization.id } },
    data: { flag: z.enum(["", ...FLAGS]).parse(flag) },
  });
  // Which flag is itself restricted, so only the fact of a change is recorded.
  await audit(organization.id, user.id, "changeFlag", { subjectId: id });
}
