"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { allowedFormSubmissionWhere } from "@/utils/library";

export async function findFormSubmissionById(submissionId: string) {
  const context = await requireMember("viewDashboard");

  return await prisma.formSubmission.findFirst({
    where: { AND: [allowedFormSubmissionWhere(context), { id: submissionId }] },
  });
}
