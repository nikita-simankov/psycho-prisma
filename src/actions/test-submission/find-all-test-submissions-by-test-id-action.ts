"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { allowedSubmissionWhere } from "@/utils/library";

export async function findAllTestSubmissionsByTestId(testId: string) {
  const context = await requireMember("viewDashboard");

  return prisma.testSubmission.findMany({
    where: { AND: [await allowedSubmissionWhere(context), { testId }] },
    orderBy: { createdAt: "desc" },
  });
}
