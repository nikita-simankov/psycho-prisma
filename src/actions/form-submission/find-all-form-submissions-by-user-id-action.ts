"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function findAllFormSubmissionsByUserId(userId: string) {
  const { organization } = await requireMember("viewDashboard");

  return await prisma.formSubmission.findMany({
    where: {
      organizationId: organization.id,
      userId: userId,
    },
  });
}
