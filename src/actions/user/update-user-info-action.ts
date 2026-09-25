"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { publicUserSelect } from "@/utils/user";
import { z } from "zod";

// Photos are stored inline as base64 JPEG; 2.5M characters is roughly a 1.9 MB image.
const MAX_IMAGE_LENGTH = 2_500_000;

// Only profile fields an admin may edit; email, password and phone are excluded.
const userInfoSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    middleName: z.string().trim().max(100),
    lastName: z.string().trim().min(1).max(100),
    dateOfBirth: z.string().trim().max(20),
    imageURL: z
      .string()
      .max(MAX_IMAGE_LENGTH)
      .regex(/^[A-Za-z0-9+/=]*$/, "Photo must be a base64-encoded image"),
  })
  .partial()
  .strict();

export async function UpdateUserInfoAction(id: string, data: unknown) {
  const { organization } = await requireMember("manageMembers");

  // Only people in the admin's own organization can be edited.
  await prisma.membership.findUniqueOrThrow({
    where: { userId_organizationId: { userId: z.string().parse(id), organizationId: organization.id } },
  });

  return prisma.user.update({
    where: { id: z.string().parse(id) },
    data: userInfoSchema.parse(data),
    select: publicUserSelect,
  });
}
