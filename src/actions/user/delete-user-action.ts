"use server";

import { prisma } from "@/utils/database";

export async function deleteUserAction(userId: string) {
  return await prisma.user.delete({
    where: {
      id: userId,
    },
  });
}
