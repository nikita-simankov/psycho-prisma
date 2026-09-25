import "server-only";

import type { Context } from "./authentication";
import { prisma } from "./database";
import { can } from "./roles";

// Instruments an organization can use: the shared library plus its own uploads.
export function libraryWhere(organizationId: string) {
  return { OR: [{ organizationId: null }, { organizationId }] };
}

// Filter for test submissions this person may see. Sensitive screens are left out
// unless their role may view them.
export async function allowedSubmissionWhere(context: Context) {
  if (can(context.membership.role, "viewSensitive")) {
    return { organizationId: context.organization.id };
  }

  const sensitive = await prisma.test.findMany({ where: { sensitive: true }, select: { id: true } });

  return {
    organizationId: context.organization.id,
    testId: { notIn: sensitive.map((test) => test.id) },
  };
}
