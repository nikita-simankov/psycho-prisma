"use server";

import { requireUser } from "@/utils/authentication";
import { localizeForm } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { getLocale } from "next-intl/server";

export async function findAllForms() {
  const user = await requireUser();

  const [forms, locale] = await Promise.all([
    prisma.form.findMany({
      where: user.role === "admin" ? undefined : { adminOnly: false },
      include: { categories: true },
    }),
    getLocale(),
  ]);

  return forms.map((form) => localizeForm(form, locale));
}
