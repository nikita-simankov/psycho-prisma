"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { allowedSubmissionWhere } from "@/utils/library";

export async function findTestSubmissionById(submissionId: string) {
  const context = await requireMember("viewDashboard");

  return prisma.testSubmission.findFirst({
    where: { AND: [await allowedSubmissionWhere(context), { id: submissionId }] },
  });
}
