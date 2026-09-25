"use server";

import { requireMember } from "@/utils/authentication";
import { localizeForm } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { libraryWhere } from "@/utils/library";
import { can } from "@/utils/roles";
import { getLocale } from "next-intl/server";

export async function findFormById(formId: string) {
  const { membership, organization } = await requireMember();
  const staff = can(membership.role, "viewDashboard");

  const form = await prisma.form.findFirst({
    where: { id: formId, AND: [libraryWhere(organization.id), staff ? {} : { adminOnly: false }] },
  });

  return form && localizeForm(form, await getLocale());
}
