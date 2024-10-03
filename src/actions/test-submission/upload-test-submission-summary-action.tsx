"use server";

import { prisma } from "@/utils/database";

export async function uploadTestSubmissionSummary(
  submissionId: string,
  summary: string
) {
  return await prisma.testSubmission.update({
    where: {
      id: submissionId,
    },
    data: {
      summary: summary,
    },
  });
}
