"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { allowedSubmissionWhere } from "@/utils/library";

export async function findAllTestSubmissions() {
  const context = await requireMember("viewDashboard");

  return prisma.testSubmission.findMany({
    where: await allowedSubmissionWhere(context),
    orderBy: { createdAt: "desc" },
  });
}
