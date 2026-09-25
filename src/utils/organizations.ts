import "server-only";

import { prisma } from "./database";

// URL-safe identifier from the name, made unique with a numeric suffix.
async function uniqueSlug(name: string) {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "organization";

  for (let suffix = 1; ; suffix++) {
    const slug = suffix === 1 ? base : `${base}-${suffix}`;

    if (!(await prisma.organization.findUnique({ where: { slug }, select: { id: true } }))) {
      return slug;
    }
  }
}

export async function createOwnedOrganization(userId: string, name: string) {
  return prisma.organization.create({
    data: {
      name,
      slug: await uniqueSlug(name),
      memberships: { create: { userId, role: "owner", consentedAt: new Date() } },
    },
  });
}
