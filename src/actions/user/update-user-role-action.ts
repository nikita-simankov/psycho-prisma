"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { publicUserSelect } from "@/utils/user";
import { z } from "zod";

const roleSchema = z.enum(["user", "admin"]);

export async function updateUserRole(userId: string, role: string) {
  const admin = await requireAdmin();
  const parsedRole = roleSchema.parse(role);

  if (admin.id === userId && parsedRole !== "admin") {
    throw new Error("You cannot remove your own admin role");
  }

  return prisma.user.update({
    where: { id: z.string().parse(userId) },
    data: { role: parsedRole },
    select: publicUserSelect,
  });
}
