"use server";

import { prisma } from "@/utils/database";

export async function findAllTests() {
  return await prisma.test.findMany();
}
