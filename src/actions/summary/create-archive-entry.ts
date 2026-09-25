"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { z } from "zod";

// Saves a person's conclusion, replacing the one already archived for them.
export async function createArchiveEntryAction(userId: string, verdict: string, additionalNotes: string) {
  const { organization } = await requireMember("writeConclusions");
  const data = {
    verdict: z.string().max(50_000).parse(verdict),
    additionalNotes: z.string().max(50_000).parse(additionalNotes),
  };

  await prisma.membership.findUniqueOrThrow({
    where: { userId_organizationId: { userId, organizationId: organization.id } },
  });

  return prisma.userSummary.upsert({
    where: { userId_organizationId: { userId, organizationId: organization.id } },
    create: { userId, organizationId: organization.id, ...data },
    update: data,
  });
}
