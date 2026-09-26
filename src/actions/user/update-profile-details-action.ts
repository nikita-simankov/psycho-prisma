"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { cleanCustomValues, EMPLOYMENT_TYPES, parseCustomFields } from "@/utils/profile-fields";
import { z } from "zod";

const detailsSchema = z
  .object({
    managerId: z.string().nullable(),
    startDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
    location: z.string().trim().max(120),
    employmentType: z.union([z.literal(""), z.enum(EMPLOYMENT_TYPES)]),
    tags: z.array(z.string().trim().min(1).max(40)).max(20),
    customValues: z.record(z.string().max(200)),
  })
  .strict();

// Manager, start date, location, employment type, tags and the organization's own fields.
export async function updateProfileDetails(userId: unknown, data: unknown) {
  const { organization } = await requireMember("manageMembers");
  const id = z.string().parse(userId);
  const details = detailsSchema.parse(data);

  if (details.managerId) {
    if (details.managerId === id) throw new Error("A person cannot manage themselves");
    await prisma.membership.findUniqueOrThrow({
      where: { userId_organizationId: { userId: details.managerId, organizationId: organization.id } },
    });
  }

  const { customFields } = await prisma.organization.findUniqueOrThrow({
    where: { id: organization.id },
    select: { customFields: true },
  });

  await prisma.membership.update({
    where: { userId_organizationId: { userId: id, organizationId: organization.id } },
    data: {
      managerId: details.managerId,
      startDate: details.startDate,
      location: details.location,
      employmentType: details.employmentType,
      tags: JSON.stringify(Array.from(new Set(details.tags))),
      customValues: JSON.stringify(cleanCustomValues(parseCustomFields(customFields), details.customValues)),
    },
  });
}
