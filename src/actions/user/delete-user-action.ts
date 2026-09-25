"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function deleteUserAction(userId: string) {
  const admin = await requireAdmin();

  if (admin.id === userId) {
    throw new Error("You cannot delete your own account");
  }

  await prisma.user.delete({ where: { id: userId } });
}
