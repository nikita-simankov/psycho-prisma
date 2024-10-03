"use server";

import { prisma } from "@/utils/database";

export async function findAllTestSubmissionsByUserId(userId: string) {
  return await prisma.testSubmission.findMany({
    where: {
      userId: userId,
    },
  });
}
