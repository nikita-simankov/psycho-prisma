"use server";

import { prisma } from "@/utils/database";

export async function createArchiveEntryAction(
  userId: string,
  verdict: string,
  additionalNotes: string
) {
  const createdArchiveEntry = await prisma.userSummary.create({
    data: {
      userId: userId,
      verdict: verdict,
      additionalNotes: additionalNotes,
    },
  });

  return createdArchiveEntry;
}
