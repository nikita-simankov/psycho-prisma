"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function deleteArchiveEntry(entryId: string) {
  await requireAdmin();

  return await prisma.userSummary.delete({
    where: {
      id: entryId,
    },
  });
}
