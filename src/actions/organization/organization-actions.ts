"use server";

import { requireMember, requireUser } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { createOwnedOrganization } from "@/utils/organizations";
import { rememberOrganization } from "@/utils/session";
import { z } from "zod";

const nameSchema = z.string().trim().min(2).max(100);

// Creates an organization owned by the signed-in person and switches to it.
export async function createOrganization(name: string) {
  const user = await requireUser();
  const organizationName = nameSchema.parse(name);

  const organization = await createOwnedOrganization(user.id, organizationName);

  rememberOrganization(organization.id);

  return { id: organization.id };
}

export async function switchOrganization(organizationId: string) {
  const user = await requireUser();

  await prisma.membership.findUniqueOrThrow({
    where: { userId_organizationId: { userId: user.id, organizationId: z.string().parse(organizationId) } },
  });

  rememberOrganization(organizationId);
}

const settingsSchema = z
  .object({
    name: nameSchema,
    privacyContact: z.string().trim().max(300),
    respondentFeedback: z.boolean(),
  })
  .partial()
  .strict();

export async function updateOrganizationSettings(data: unknown) {
  const { organization } = await requireMember("manageSettings");

  await prisma.organization.update({ where: { id: organization.id }, data: settingsSchema.parse(data) });
}
