"use server";

import { requireUser } from "@/utils/authentication";
import { prisma } from "@/utils/database";

export async function acceptConsent() {
  const user = await requireUser();

  await prisma.user.update({
    where: { id: user.id },
    data: { consentedAt: new Date() },
  });
}
