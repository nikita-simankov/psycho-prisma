"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { FLAGS } from "@/utils/flags";
import { z } from "zod";

// Restricted follow-up flag; only roles that may see sensitive results can set it.
export async function updateFlag(userId: string, flag: string) {
  const { organization } = await requireMember("viewSensitive");

  await prisma.membership.update({
    where: { userId_organizationId: { userId: z.string().parse(userId), organizationId: organization.id } },
    data: { flag: z.enum(["", ...FLAGS]).parse(flag) },
  });
}
