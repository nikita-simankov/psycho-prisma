"use server";

import { requireUser } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function findAllTests() {
  await requireUser();

  return await prisma.test.findMany({
    include: {
      categories: true,
    },
  });
}
