"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function findAllTestSubmissionsByTestId(testId: string) {
  await requireAdmin();

  return await prisma.testSubmission.findMany({
    where: {
      testId: testId,
    },
  });
}
