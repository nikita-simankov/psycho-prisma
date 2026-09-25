"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function findAllTestSubmissions() {
  await requireAdmin();

  return await prisma.testSubmission.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}
