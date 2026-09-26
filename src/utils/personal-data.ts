import "server-only";

import { audit } from "./audit";
import type { FormQuestion, FormQuestionResponse, TestQuestion, TestQuestionResponse } from "./constants";
import { localizeForm, localizeTest } from "./content-translation";
import { prisma } from "./database";
import { formsAsAnswered, testsAsAnswered } from "./instrument-versions";
import { publicUserSelect, type PublicUser } from "./user";

function parse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// Everything the platform holds about one person, in readable form: their account, their
// place in each organization, their answers with the question texts, scores, assignments and
// saved reports about them. Each organization records that the export happened.
export async function collectPersonalData(userId: string, locale: string) {
  const [user, memberships, testSubmissions, formSubmissions, assignments, reports] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { ...publicUserSelect, locale: true } }),
    prisma.membership.findMany({
      where: { userId },
      include: { organization: { select: { id: true, name: true } }, team: { select: { name: true } } },
    }),
    prisma.testSubmission.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.formSubmission.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.assignment.findMany({
      where: { userId },
      select: { createdAt: true, completedAt: true, round: { select: { name: true, organizationId: true, dueAt: true } } },
    }),
    prisma.reportVersion.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
  ]);

  const [tests, forms] = await Promise.all([
    prisma.test.findMany({ where: { id: { in: Array.from(new Set(testSubmissions.map((submission) => submission.testId))) } } }),
    prisma.form.findMany({ where: { id: { in: Array.from(new Set(formSubmissions.map((submission) => submission.formId))) } } }),
  ]);
  const [testFor, formFor] = await Promise.all([testsAsAnswered(tests, testSubmissions), formsAsAnswered(forms, formSubmissions)]);
  const testOf = (submission: (typeof testSubmissions)[number]) => {
    const test = testFor(submission);
    return test && localizeTest(test, locale);
  };
  const formOf = (submission: (typeof formSubmissions)[number]) => {
    const form = formFor(submission);
    return form && localizeForm(form, locale);
  };
  const organizationName = new Map(memberships.map((membership) => [membership.organization.id, membership.organization.name]));

  return {
    exportedAt: new Date().toISOString(),
    account: user satisfies PublicUser,
    organizations: memberships.map((membership) => ({
      organization: membership.organization.name,
      role: membership.role,
      team: membership.team?.name ?? null,
      position: membership.position,
      joinedAt: membership.createdAt,
      privacyNoticeAcceptedAt: membership.consentedAt,
      startDate: membership.startDate || null,
      location: membership.location || null,
      employmentType: membership.employmentType || null,
      tags: parse<string[]>(membership.tags, []),
      otherDetails: parse<Record<string, string>>(membership.customValues, {}),
    })),
    tests: testSubmissions.map((submission) => {
      const test = testOf(submission);
      const questions = test ? parse<TestQuestion[]>(test.questions, []) : [];
      return {
        organization: organizationName.get(submission.organizationId) ?? null,
        test: test?.name ?? submission.testId,
        takenAt: submission.createdAt,
        answers: parse<TestQuestionResponse[]>(submission.submission, []).map((response) => {
          const question = questions.find((entry) => entry.id === response.questionId);
          return {
            question: question?.text ?? String(response.questionId),
            answer: question?.choices.find((choice) => choice.id === response.choiceId)?.text ?? String(response.choiceId),
          };
        }),
        scores: parse<unknown>(submission.summary, null),
      };
    }),
    questionnaires: formSubmissions.map((submission) => {
      const form = formOf(submission);
      const questions = form ? parse<FormQuestion[]>(form.questions, []) : [];
      return {
        organization: organizationName.get(submission.organizationId) ?? null,
        questionnaire: form?.name ?? submission.formId,
        answeredAt: submission.createdAt,
        answers: parse<FormQuestionResponse[]>(submission.submission, []).map((response) => ({
          question: questions.find((entry) => entry.id === response.fieldId)?.text ?? String(response.fieldId),
          answer: response.response,
        })),
      };
    }),
    rounds: assignments.map((assignment) => ({
      organization: organizationName.get(assignment.round.organizationId) ?? null,
      round: assignment.round.name,
      sentAt: assignment.createdAt,
      dueAt: assignment.round.dueAt,
      completedAt: assignment.completedAt,
    })),
    reports: reports.map((report) => ({
      organization: organizationName.get(report.organizationId) ?? null,
      version: report.version,
      savedAt: report.createdAt,
      background: report.background,
      conclusion: report.conclusion,
    })),
  };
}

export async function recordExport(user: PublicUser, organizationIds: string[]) {
  await Promise.all(
    organizationIds.map((id) => audit(id, user.id, "exportPersonalData", { subjectId: user.id }))
  );
}
