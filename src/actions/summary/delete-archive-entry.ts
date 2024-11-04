"use server";

import { prisma } from "@/utils/database";

export async function deleteArchiveEntry(entryId: string) {
  return await prisma.userSummary.delete({
    where: {
      id: entryId,
    },
  });
}
