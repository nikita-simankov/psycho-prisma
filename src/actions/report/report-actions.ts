"use server";

import { requireMember } from "@/utils/authentication";
import { auditAs } from "@/utils/audit";
import { prisma } from "@/utils/database";
import { allowedSubmissionWhere } from "@/utils/library";
import { z } from "zod";

const draftSchema = z
  .object({
    background: z.string().max(50_000),
    conclusion: z.string().max(50_000),
  })
  .strict();

async function findPerson(userId: unknown) {
  const context = await requireMember("writeConclusions");
  const id = z.string().parse(userId);
  await prisma.membership.findUniqueOrThrow({
    where: { userId_organizationId: { userId: id, organizationId: context.organization.id } },
  });
  return { context, userId: id };
}

// Saves the background and conclusion as they are typed.
export async function saveReportDraft(userId: unknown, data: unknown) {
  const { context, userId: id } = await findPerson(userId);
  const draft = draftSchema.parse(data);
  const values = { additionalNotes: draft.background, verdict: draft.conclusion };

  const saved = await prisma.userSummary.upsert({
    where: { userId_organizationId: { userId: id, organizationId: context.organization.id } },
    create: { userId: id, organizationId: context.organization.id, ...values },
    update: values,
  });

  return { savedAt: saved.updatedAt };
}

// Freezes the current report as the next numbered version, with the results it covers.
export async function saveReportVersion(userId: unknown) {
  const { context, userId: id } = await findPerson(userId);
  const organizationId = context.organization.id;

  const [draft, submissions, latest] = await Promise.all([
    prisma.userSummary.findUnique({ where: { userId_organizationId: { userId: id, organizationId } } }),
    prisma.testSubmission.findMany({
      where: { AND: [await allowedSubmissionWhere(context), { userId: id }] },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.reportVersion.findFirst({ where: { organizationId, userId: id }, orderBy: { version: "desc" } }),
  ]);

  const version = await prisma.reportVersion.create({
    data: {
      organizationId,
      userId: id,
      version: (latest?.version ?? 0) + 1,
      background: draft?.additionalNotes ?? "",
      conclusion: draft?.verdict ?? "",
      submissionIds: JSON.stringify(submissions.map((submission) => submission.id)),
      createdById: context.user.id,
    },
  });

  await auditAs(context, "saveReportVersion", { subjectId: id, detail: { version: version.version } });

  return { version: version.version };
}
