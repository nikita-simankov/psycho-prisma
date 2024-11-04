"use server";

import { prisma } from "@/utils/database";

export async function updateUserRole(userId: string, role: string) {
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role: role,
    },
  });
}
