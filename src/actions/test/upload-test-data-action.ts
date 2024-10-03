"use server";

import { prisma } from "@/utils/database";
import { TestData } from "@/utils/constants";

export async function uploadTestData(data: TestData) {
  return await prisma.test.create({
    data: {
      name: data.name,
      strategy: data.strategy,
      description: data.description,
      instruction: data.instruction,

      scales: JSON.stringify(data.scales),
      questions: JSON.stringify(data.questions),

      stanTable: JSON.stringify(data.stanTable),
      tGradeTable: JSON.stringify(data.tGradeTable),
      summaryTable: JSON.stringify(data.summaryTable),
    },
  });
}
