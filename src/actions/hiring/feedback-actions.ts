"use server";

import { auditAs } from "@/utils/audit";
import { requireMember, type Context } from "@/utils/authentication";
import { selectStrengths } from "@/utils/candidate-feedback";
import { prisma } from "@/utils/database";
import { feedbackEmail, isHiringCandidate, mailLocale, shareableResults } from "@/utils/hiring";
import { sendMail } from "@/utils/mail";
import { z } from "zod";

const sendSchema = z
  .object({
    userId: z.string().min(1),
    note: z.string().trim().max(1000).default(""),
  })
  .strict();

// The candidate and the feedback email they would get, in their own language.
async function draft(context: Context, userId: string, note: string) {
  const organizationId = context.organization.id;
  if (!(await isHiringCandidate(organizationId, userId))) {
    return null;
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, locale: true } });
  if (!user?.email) {
    return null;
  }
  // Scale names in the candidate's language, since the email is written in it.
  const results = await shareableResults(organizationId, userId, mailLocale(user.locale));
  const strengths = selectStrengths(results.map((result) => ({ testName: result.testName, rows: result.rows })));
  const email = await feedbackEmail(user, context.organization.name, strengths, note);
  return { user: { ...user, email: user.email }, strengths, email };
}

export type FeedbackPreview = {
  to: string;
  subject: string;
  heading: string;
  paragraphs: string[];
  notes: string[];
};

// Exactly what the candidate will receive, before anything is sent.
export async function previewFeedback(userId: string, note = ""): Promise<FeedbackPreview | { error: "notCandidate" }> {
  const context = await requireMember("viewIndividualResults");
  const found = await draft(context, z.string().min(1).parse(userId), z.string().trim().max(1000).parse(note));
  if (!found) {
    return { error: "notCandidate" };
  }
  const { content } = found.email;
  return { to: found.user.email, subject: found.email.subject, heading: content.heading, paragraphs: content.paragraphs, notes: content.notes };
}

export type SendFeedbackResult = { ok: true; emailed: boolean } | { error: "notCandidate" | "emailUnverified" };

export async function sendFeedback(data: unknown): Promise<SendFeedbackResult> {
  const context = await requireMember("viewIndividualResults");
  // Unconfirmed accounts can't email other people (see the confirmation banner).
  if (!context.user.emailVerifiedAt) {
    return { error: "emailUnverified" };
  }
  const input = sendSchema.parse(data);
  const found = await draft(context, input.userId, input.note);
  if (!found) {
    return { error: "notCandidate" };
  }

  const { subject, html, text } = found.email;
  const emailed = await sendMail({ to: found.user.email, subject, html, text });
  const sent = await prisma.sentFeedback.create({
    data: {
      organizationId: context.organization.id,
      userId: found.user.id,
      strengths: JSON.stringify(found.strengths.map((strength) => strength.scaleName)),
      note: input.note,
      emailed,
      sentById: context.user.id,
    },
  });
  await auditAs(context, "sendCandidateFeedback", { subjectId: found.user.id, detail: { feedbackId: sent.id, emailed } });

  return { ok: true, emailed };
}
