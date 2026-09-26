"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { allowedFormSubmissionWhere } from "@/utils/library";

export async function findAllFormSubmissionsByUserId(userId: string) {
  const context = await requireMember("viewDashboard");

  return await prisma.formSubmission.findMany({
    where: { AND: [allowedFormSubmissionWhere(context), { userId: userId }] },
  });
}
