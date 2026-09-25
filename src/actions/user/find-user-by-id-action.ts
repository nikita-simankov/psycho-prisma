"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { publicUserSelect } from "@/utils/user";

export async function findUserById(userId: string) {
  await requireAdmin();

  return prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
}
