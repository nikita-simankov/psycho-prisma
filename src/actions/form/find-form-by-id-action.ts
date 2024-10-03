"use server";

import { prisma } from "@/utils/database";

export async function findFormById(formId: string) {
  return await prisma.form.findFirst({
    where: {
      id: formId,
    },
  });
}
