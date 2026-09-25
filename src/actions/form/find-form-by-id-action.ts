"use server";

import { requireUser } from "@/utils/authentication";
import { localizeForm } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { getLocale } from "next-intl/server";

export async function findFormById(formId: string) {
  const user = await requireUser();

  const form = await prisma.form.findUnique({ where: { id: formId } });

  if (!form || (form.adminOnly && user.role !== "admin")) {
    return null;
  }

  return localizeForm(form, await getLocale());
}
