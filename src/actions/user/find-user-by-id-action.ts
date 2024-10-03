"use server";

import { prisma } from "@/utils/database";

export async function findUserById(userId: string) {
  return await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });
}
