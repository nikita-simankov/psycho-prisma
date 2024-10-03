"use server";

import { prisma } from "@/utils/database";

export async function findFormSubmissionById(submissionId: string) {
  return await prisma.formSubmission.findFirst({
    where: {
      id: submissionId,
    },
  });
}
