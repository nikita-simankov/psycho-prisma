"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { publicUserSelect } from "@/utils/user";

export async function findAllUsers() {
  await requireAdmin();

  return prisma.user.findMany({ select: publicUserSelect });
}
