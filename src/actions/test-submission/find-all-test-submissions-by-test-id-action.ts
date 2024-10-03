"use server";

import { prisma } from "@/utils/database";

export async function findAllTestSubmissionsByTestId(testId: string) {
  return await prisma.testSubmission.findMany({
    where: {
      testId: testId,
    },
  });
}
