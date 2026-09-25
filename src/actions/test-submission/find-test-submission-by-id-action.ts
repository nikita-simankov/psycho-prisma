"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function findTestSubmissionById(submissionId: string) {
  await requireAdmin();

  return await prisma.testSubmission.findFirst({
    where: {
      id: submissionId,
    },
  });
}
