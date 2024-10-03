"use server";

import { prisma } from "@/utils/database";

export async function updateUserGroup(userId: string, group: string) {
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      group: group,
    },
  });
}
