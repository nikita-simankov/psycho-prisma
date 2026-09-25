"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { publicUserSelect } from "@/utils/user";

export async function findAllArchiveEntries() {
  await requireAdmin();

  return prisma.userSummary.findMany({
    include: { user: { select: publicUserSelect } },
    orderBy: { createdAt: "desc" },
  });
}

export async function findArchiveEntryByUserId(userId: string) {
  await requireAdmin();

  return prisma.userSummary.findUnique({ where: { userId } });
}
