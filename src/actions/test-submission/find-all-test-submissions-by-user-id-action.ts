"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function findAllTestSubmissionsByUserId(userId: string) {
  await requireAdmin();

  return await prisma.testSubmission.findMany({
    where: {
      userId: userId,
    },
  });
}
