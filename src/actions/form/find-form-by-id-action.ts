"use server";

import { requireMember } from "@/utils/authentication";
import { localizeForm } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { libraryWhere } from "@/utils/library";
import { can } from "@/utils/roles";
import { openAssignmentFor } from "@/utils/rounds";
import { getLocale } from "next-intl/server";

// Staff can open any questionnaire in the library; everyone else only ones sent to them in an open round.
export async function findFormById(formId: string) {
  const { user, membership, organization } = await requireMember();
  const staff = can(membership.role, "viewDashboard");

  if (!staff && !(await openAssignmentFor(user.id, organization.id, { kind: "form", id: formId }))) {
    return null;
  }

  const form = await prisma.form.findFirst({
    where: { id: formId, AND: [libraryWhere(organization.id), staff ? {} : { adminOnly: false }] },
  });

  return form && localizeForm(form, await getLocale());
}
