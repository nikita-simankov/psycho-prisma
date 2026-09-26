import "server-only";

import { RESERVED_SLUGS } from "./constants";
import { trialData } from "./billing";
import { prisma } from "./database";

// "Acme  Ltd" and "acme ltd" have the same key.
export function organizationNameKey(name: string) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

// URL-safe identifier from the name (Cyrillic is transliterated), made unique with a numeric suffix.
export async function uniqueSlug(name: string) {
  const base =
    Array.from(name.toLowerCase())
      .map((char) => CYRILLIC[char] ?? char)
      .join("")
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "organization";

  for (let suffix = 1; ; suffix++) {
    const slug = suffix === 1 && !RESERVED_SLUGS.has(base) ? base : `${base}-${suffix}`;

    if (!(await prisma.organization.findUnique({ where: { slug }, select: { id: true } }))) {
      return slug;
    }
  }
}

export async function createOwnedOrganization(userId: string, name: string) {
  const cleanName = name.trim().replace(/\s+/g, " ");

  return prisma.organization.create({
    data: {
      name: cleanName,
      nameKey: organizationNameKey(cleanName),
      slug: await uniqueSlug(cleanName),
      memberships: { create: { userId, role: "owner", consentedAt: new Date() } },
      // New organizations send round emails in working hours; see src/utils/quiet-hours.ts.
      quietHours: true,
      // Every new organization starts with a Business trial (src/utils/billing-rules.ts).
      subscription: { create: trialData() },
    },
  });
}

// Everything that goes when an organization is deleted: people's memberships, results,
// conclusions, teams, invitations and uploaded instruments. Accounts themselves are kept.
export function organizationDeletion(organizationId: string) {
  const scope = { organizationId };
  return [
    prisma.testSubmission.deleteMany({ where: scope }),
    prisma.formSubmission.deleteMany({ where: scope }),
    prisma.userSummary.deleteMany({ where: scope }),
    prisma.reportVersion.deleteMany({ where: scope }),
    prisma.draft.deleteMany({ where: scope }),
    prisma.analyticsView.deleteMany({ where: scope }),
    prisma.auditEvent.deleteMany({ where: scope }),
    prisma.test.deleteMany({ where: scope }),
    prisma.form.deleteMany({ where: scope }),
    prisma.organization.delete({ where: { id: organizationId } }),
  ];
}
