"use server";

import { requireUser } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function findAllForms() {
  const user = await requireUser();

  return prisma.form.findMany({
    where: user.role === "admin" ? undefined : { adminOnly: false },
    include: { categories: true },
  });
}
