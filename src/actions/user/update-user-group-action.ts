"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { publicUserSelect } from "@/utils/user";
import { z } from "zod";

export async function updateUserGroup(userId: string, group: string) {
  await requireAdmin();

  return prisma.user.update({
    where: { id: z.string().parse(userId) },
    data: { group: z.string().trim().min(1).max(100).parse(group) },
    select: publicUserSelect,
  });
}
