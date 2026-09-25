"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function findFormSubmissionById(submissionId: string) {
  await requireAdmin();

  return await prisma.formSubmission.findFirst({
    where: {
      id: submissionId,
    },
  });
}
