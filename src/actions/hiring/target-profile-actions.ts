"use server";

import { requireMember } from "@/utils/authentication";
import type { TestScale } from "@/utils/constants";
import { prisma } from "@/utils/database";
import { libraryWhere } from "@/utils/library";
import { TARGET_LIMITS, targetKind } from "@/utils/target-profiles";
import { validityScaleIds } from "@/utils/validity";
import { z } from "zod";

const bandSchema = z
  .object({
    scaleId: z.number().int(),
    min: z.number().int(),
    max: z.number().int(),
    low: z.string().trim().max(1000).default(""),
    high: z.string().trim().max(1000).default(""),
  })
  .strict()
  .refine((band) => band.min <= band.max);

const profileSchema = z
  .object({
    // Null for a new profile.
    id: z.string().nullable().default(null),
    testId: z.string().min(1),
    name: z.string().trim().min(1).max(100),
    bands: z.array(bandSchema).min(1).max(60),
  })
  .strict();

export type SaveTargetProfileResult = { ok: true; id: string } | { error: "unknownTest" | "noNorms" | "invalidBand" | "notFound" };

// Creates or changes a target profile for one of the tests the organization can use.
export async function saveTargetProfile(data: unknown): Promise<SaveTargetProfileResult> {
  const { user, organization } = await requireMember("manageRounds");
  const input = profileSchema.parse(data);

  // Clinical and wellbeing screens never go to hiring, so they get no targets.
  const test = await prisma.test.findFirst({ where: { id: input.testId, sensitive: false, AND: [libraryWhere(organization.id)] } });
  if (!test) {
    return { error: "unknownTest" };
  }
  const kind = targetKind(test.strategy);
  if (!kind) {
    return { error: "noNorms" };
  }

  const scales = JSON.parse(test.scales) as TestScale[];
  const validity = validityScaleIds(scales);
  const scaleIds = new Set(scales.filter((scale) => !validity.has(scale.id)).map((scale) => scale.id));
  const limits = TARGET_LIMITS[kind];
  const ids = input.bands.map((band) => band.scaleId);
  if (
    new Set(ids).size !== ids.length ||
    input.bands.some((band) => !scaleIds.has(band.scaleId) || band.min < limits.min || band.max > limits.max)
  ) {
    return { error: "invalidBand" };
  }

  const scalesJson = JSON.stringify(input.bands);
  if (input.id) {
    const { count } = await prisma.targetProfile.updateMany({
      where: { id: input.id, organizationId: organization.id, testId: test.id },
      data: { name: input.name, scales: scalesJson },
    });
    return count ? { ok: true, id: input.id } : { error: "notFound" };
  }

  const created = await prisma.targetProfile.create({
    data: { organizationId: organization.id, testId: test.id, name: input.name, scales: scalesJson, createdById: user.id },
  });
  return { ok: true, id: created.id };
}

export async function deleteTargetProfile(id: string) {
  const { organization } = await requireMember("manageRounds");
  await prisma.targetProfile.deleteMany({ where: { id: z.string().min(1).parse(id), organizationId: organization.id } });
  return { ok: true };
}
