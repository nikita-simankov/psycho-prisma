"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function deleteArchiveEntry(entryId: string) {
  const { organization } = await requireMember("writeConclusions");

  await prisma.userSummary.deleteMany({
    where: { id: entryId, organizationId: organization.id },
  });
}
