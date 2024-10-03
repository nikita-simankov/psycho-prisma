"use server";

import { prisma } from "@/utils/database";

export async function findTestSubmissionById(submissionId: string) {
  return await prisma.testSubmission.findFirst({
    where: {
      id: submissionId,
    },
  });
}
