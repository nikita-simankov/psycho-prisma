"use server";

import { prisma } from "@/utils/database";

export async function findAllForms() {
  return await prisma.form.findMany({
    include: {
      categories: true,
    },
  });
}
