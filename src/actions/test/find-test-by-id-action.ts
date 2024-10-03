"use server";

import { prisma } from "@/utils/database";

export async function findTestById(testId: string) {
  return await prisma.test.findFirst({
    where: {
      id: testId,
    },
  });
}
