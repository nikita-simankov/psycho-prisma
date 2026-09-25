"use server";

import { requireUser } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function findFormById(formId: string) {
  const user = await requireUser();

  const form = await prisma.form.findUnique({ where: { id: formId } });

  if (form?.adminOnly && user.role !== "admin") {
    return null;
  }

  return form;
}
