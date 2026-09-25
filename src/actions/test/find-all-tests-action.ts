"use server";

import { requireUser } from "@/utils/authentication";
import { localizeTest } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { getLocale } from "next-intl/server";

export async function findAllTests() {
  await requireUser();

  const [tests, locale] = await Promise.all([
    prisma.test.findMany({ include: { categories: true } }),
    getLocale(),
  ]);

  return tests.map((test) => localizeTest(test, locale));
}
