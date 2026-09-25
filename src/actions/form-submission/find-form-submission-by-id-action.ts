"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function findFormSubmissionById(submissionId: string) {
  const { organization } = await requireMember("viewDashboard");

  return await prisma.formSubmission.findFirst({
    where: {
      organizationId: organization.id,
      id: submissionId,
    },
  });
}
