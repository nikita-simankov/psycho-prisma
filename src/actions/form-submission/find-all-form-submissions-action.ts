"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function findAllFormSubmissions(formId: string) {
  const { organization } = await requireMember("viewDashboard");

  return await prisma.formSubmission.findMany({
    where: {
      organizationId: organization.id,
      formId: formId,
    },
  });
}
