"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function findAllFormSubmissionsByFormId(formId: string) {
  await requireAdmin();

  return await prisma.formSubmission.findMany({
    where: {
      formId: formId,
    },
  });
}
