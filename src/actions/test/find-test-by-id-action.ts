"use server";

import { requireUser } from "@/utils/authentication";
import { localizeTest } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { getLocale } from "next-intl/server";

export async function findTestById(testId: string) {
  await requireUser();

  const test = await prisma.test.findUnique({ where: { id: testId } });

  return test && localizeTest(test, await getLocale());
}
