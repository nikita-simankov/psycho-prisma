"use server";

import { prisma } from "@/utils/database";

export async function findAllFormSubmissionsByUserId(userId: string) {
  return await prisma.formSubmission.findMany({
    where: {
      userId: userId,
    },
  });
}
