import "server-only";

import type { Context } from "./authentication";
import { prisma } from "./database";
import { can } from "./roles";

// Instruments an organization can use: the shared library plus its own uploads.
export function libraryWhere(organizationId: string) {
  return { OR: [{ organizationId: null }, { organizationId }] };
}

// Filter for test submissions this person may see: none for roles limited to team averages,
// and sensitive screens only for roles that may view them.
export async function allowedSubmissionWhere(context: Context) {
  if (!can(context.membership.role, "viewIndividualResults")) {
    return { organizationId: context.organization.id, id: { in: [] as string[] } };
  }

  if (can(context.membership.role, "viewSensitive")) {
    return { organizationId: context.organization.id };
  }

  const sensitive = await prisma.test.findMany({ where: { sensitive: true }, select: { id: true } });

  return {
    organizationId: context.organization.id,
    testId: { notIn: sensitive.map((test) => test.id) },
  };
}

// Filter for questionnaire answers this person may see; roles limited to team averages see none.
export function allowedFormSubmissionWhere(context: Context) {
  return can(context.membership.role, "viewIndividualResults")
    ? { organizationId: context.organization.id }
    : { organizationId: context.organization.id, id: { in: [] as string[] } };
}
