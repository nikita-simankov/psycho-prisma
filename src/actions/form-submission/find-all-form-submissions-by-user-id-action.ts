"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function findAllFormSubmissionsByUserId(userId: string) {
  await requireAdmin();

  return await prisma.formSubmission.findMany({
    where: {
      userId: userId,
    },
  });
}
