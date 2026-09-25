"use server";

import { requireMember } from "@/utils/authentication";
import { localizeForm } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { libraryWhere } from "@/utils/library";
import { can } from "@/utils/roles";
import { getLocale } from "next-intl/server";

// Staff-only questionnaires are hidden from respondents.
export async function findAllForms() {
  const { membership, organization } = await requireMember();
  const staff = can(membership.role, "viewDashboard");

  const [forms, locale] = await Promise.all([
    prisma.form.findMany({
      where: { AND: [libraryWhere(organization.id), staff ? {} : { adminOnly: false }] },
      include: { categories: true },
    }),
    getLocale(),
  ]);

  return forms.map((form) => localizeForm(form, locale));
}
