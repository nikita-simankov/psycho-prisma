"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { publicUserSelect } from "@/utils/user";
import { USER_GROUPS } from "@/utils/groups";
import { z } from "zod";

export async function updateUserGroup(userId: string, group: string) {
  await requireAdmin();

  return prisma.user.update({
    where: { id: z.string().parse(userId) },
    data: { group: z.enum(USER_GROUPS).parse(group) },
    select: publicUserSelect,
  });
}
