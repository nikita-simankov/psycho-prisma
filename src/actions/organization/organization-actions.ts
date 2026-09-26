"use server";

import { AuthorizationError, requireMember, requireUser } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import {
  createOwnedOrganization,
  isOrganizationNameTaken,
  organizationNameKey,
  OrganizationNameTakenError,
  uniqueSlug,
} from "@/utils/organizations";
import { rememberOrganization } from "@/utils/session";
import { z } from "zod";

const nameSchema = z.string().trim().min(2).max(100);

// Creates an organization owned by the signed-in person; the caller then opens /[slug].
export async function createOrganization(name: string): Promise<{ slug: string } | { error: "nameTaken" }> {
  const user = await requireUser();
  const organizationName = nameSchema.parse(name);

  try {
    const organization = await createOwnedOrganization(user.id, organizationName);
    rememberOrganization(organization.slug);
    return { slug: organization.slug };
  } catch (error) {
    if (error instanceof OrganizationNameTakenError) {
      return { error: "nameTaken" };
    }
    throw error;
  }
}

const settingsSchema = z
  .object({
    name: nameSchema,
    privacyContact: z.string().trim().max(300),
    respondentFeedback: z.boolean(),
    feedbackTestIds: z.array(z.string()).max(500),
  })
  .partial()
  .strict();

// Organizations migrated from the single-tenant app have the placeholder slug "default"; the first
// rename gives them a real address. Other slugs never change, so shared links keep working.
const PLACEHOLDER_SLUG = "default";

export async function updateOrganizationSettings(
  data: unknown
): Promise<{ ok: true; slug: string } | { error: "nameTaken" }> {
  const { organization } = await requireMember("manageSettings");
  const { name, feedbackTestIds, ...rest } = settingsSchema.parse(data);

  if (name !== undefined && (await isOrganizationNameTaken(name, organization.id))) {
    return { error: "nameTaken" };
  }

  const cleanName = name?.replace(/\s+/g, " ");
  const slug =
    cleanName && organization.slug === PLACEHOLDER_SLUG ? await uniqueSlug(cleanName) : organization.slug;

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      ...rest,
      // Only tests this organization can use, and never clinical screens.
      ...(feedbackTestIds && {
        feedbackTestIds: JSON.stringify(
          (
            await prisma.test.findMany({
              where: { id: { in: feedbackTestIds }, sensitive: false, OR: [{ organizationId: null }, { organizationId: organization.id }] },
              select: { id: true },
            })
          ).map((test) => test.id)
        ),
      }),
      slug, ...(cleanName && { name: cleanName, nameKey: organizationNameKey(cleanName) }) },
  });

  if (slug !== organization.slug) {
    rememberOrganization(slug);
  }

  return { ok: true, slug };
}

async function requireOwner() {
  const context = await requireMember();

  if (context.membership.role !== "owner") {
    throw new AuthorizationError("Forbidden");
  }

  return context;
}

// Hands the organization to another member. The previous owner stays on as an admin.
export async function transferOwnership(userId: unknown) {
  const { user, organization } = await requireOwner();
  const id = z.string().parse(userId);

  if (id === user.id) {
    throw new Error("Choose someone else");
  }

  await prisma.$transaction([
    prisma.membership.update({
      where: { userId_organizationId: { userId: id, organizationId: organization.id } },
      data: { role: "owner" },
    }),
    prisma.membership.update({
      where: { userId_organizationId: { userId: user.id, organizationId: organization.id } },
      data: { role: "admin" },
    }),
  ]);
}

// Deletes the organization with its people's memberships, results, conclusions, teams,
// invitations and uploaded instruments. Accounts themselves are kept.
export async function deleteOrganization(confirmation: unknown): Promise<{ ok: true } | { error: "nameMismatch" }> {
  const { organization } = await requireOwner();

  if (z.string().parse(confirmation).trim() !== organization.name) {
    return { error: "nameMismatch" };
  }

  const scope = { organizationId: organization.id };
  await prisma.$transaction([
    prisma.testSubmission.deleteMany({ where: scope }),
    prisma.formSubmission.deleteMany({ where: scope }),
    prisma.userSummary.deleteMany({ where: scope }),
    prisma.test.deleteMany({ where: scope }),
    prisma.form.deleteMany({ where: scope }),
    prisma.organization.delete({ where: { id: organization.id } }),
  ]);

  return { ok: true };
}

