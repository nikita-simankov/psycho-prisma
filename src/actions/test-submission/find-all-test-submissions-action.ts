"use server";

import { prisma } from "@/utils/database";

export async function findAllTestSubmissions() {
  return await prisma.testSubmission.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}
