"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { allowedSubmissionWhere } from "@/utils/library";

export async function findAllTestSubmissionsByUserId(userId: string) {
  const context = await requireMember("viewDashboard");

  return prisma.testSubmission.findMany({
    where: { AND: [await allowedSubmissionWhere(context), { userId }] },
    orderBy: { createdAt: "desc" },
  });
}
