"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function findAllFormSubmissions(formId: string) {
  await requireAdmin();

  return await prisma.formSubmission.findMany({
    where: {
      formId: formId,
    },
  });
}
