"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { publicUserSelect } from "@/utils/user";
import { z } from "zod";

// Only profile fields an admin may edit; role, password and phone are excluded.
const userInfoSchema = z
  .object({
    name: z.string().max(100),
    surname: z.string().max(100),
    lastName: z.string().max(100),
    imageURL: z.string().max(2048),
    rank: z.string().max(100),
    division: z.string().max(200),
    servingKind: z.string().max(100),
    servingPeriod: z.string().max(100),
  })
  .partial()
  .strict();

export async function UpdateUserInfoAction(id: string, data: unknown) {
  await requireAdmin();

  return prisma.user.update({
    where: { id: z.string().parse(id) },
    data: userInfoSchema.parse(data),
    select: publicUserSelect,
  });
}
