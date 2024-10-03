"use server";

import { prisma } from "@/utils/database";

export async function findAllUsers() {
  return await prisma.user.findMany();
}
