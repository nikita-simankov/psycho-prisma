"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";

// Records agreement to the active organization's privacy notice.
export async function acceptConsent() {
  const { membership } = await requireMember();

  await prisma.membership.update({
    where: { id: membership.id },
    data: { consentedAt: new Date() },
  });
}
