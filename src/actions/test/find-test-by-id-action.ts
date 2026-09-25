"use server";

import { requireUser } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function findTestById(testId: string) {
  await requireUser();

  return await prisma.test.findFirst({
    where: {
      id: testId,
    },
  });
}
