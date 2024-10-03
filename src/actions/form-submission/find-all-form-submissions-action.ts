"use server";

import { prisma } from "@/utils/database";

export async function findAllFormSubmissions(formId: string) {
  return await prisma.formSubmission.findMany({
    where: {
      formId: formId,
    },
  });
}
