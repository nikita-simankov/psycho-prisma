import "server-only";

import type { Form, Test } from "@prisma/client";
import { localizeTest } from "./content-translation";
import { prisma } from "./database";
import {
  formColumns,
  formContentOf,
  testColumns,
  testContentOf,
  type FormContent,
  type InstrumentKind,
  type TestContent,
} from "./instrument-content";

type Snapshot<T> = { content: T; translations: string };

export function snapshotOf(kind: InstrumentKind, row: Test | Form) {
  const content = kind === "test" ? testContentOf(row as Test) : formContentOf(row as Form);
  return JSON.stringify({ content, translations: row.translations } satisfies Snapshot<unknown>);
}

async function snapshots(kind: InstrumentKind, wanted: { id: string; version: number }[]) {
  if (wanted.length === 0) return new Map<string, string>();
  const rows = await prisma.instrumentVersion.findMany({
    where: { kind, OR: wanted.map((entry) => ({ instrumentId: entry.id, version: entry.version })) },
    select: { instrumentId: true, version: true, content: true },
  });
  return new Map(rows.map((row) => [`${row.instrumentId}:${row.version}`, row.content]));
}

// Returns a lookup giving each submission the test exactly as it was when answered: the
// current row for the current version, otherwise the stored snapshot laid over it.
export async function testsAsAnswered<T extends Test>(tests: T[], submissions: { testId: string; testVersion: number }[]) {
  const byId = new Map(tests.map((test) => [test.id, test]));
  const older = Array.from(
    new Map(
      submissions
        .filter((submission) => byId.has(submission.testId) && byId.get(submission.testId)!.version !== submission.testVersion)
        .map((submission) => [`${submission.testId}:${submission.testVersion}`, { id: submission.testId, version: submission.testVersion }])
    ).values()
  );
  const stored = await snapshots("test", older);

  return (submission: { testId: string; testVersion: number }): T | undefined => {
    const test = byId.get(submission.testId);
    if (!test || test.version === submission.testVersion) return test;
    const snapshot = stored.get(`${submission.testId}:${submission.testVersion}`);
    if (!snapshot) return test;
    const { content, translations } = JSON.parse(snapshot) as Snapshot<TestContent>;
    return { ...test, ...testColumns(content), translations };
  };
}

export async function formsAsAnswered<T extends Form>(forms: T[], submissions: { formId: string; formVersion: number }[]) {
  const byId = new Map(forms.map((form) => [form.id, form]));
  const older = Array.from(
    new Map(
      submissions
        .filter((submission) => byId.has(submission.formId) && byId.get(submission.formId)!.version !== submission.formVersion)
        .map((submission) => [`${submission.formId}:${submission.formVersion}`, { id: submission.formId, version: submission.formVersion }])
    ).values()
  );
  const stored = await snapshots("form", older);

  return (submission: { formId: string; formVersion: number }): T | undefined => {
    const form = byId.get(submission.formId);
    if (!form || form.version === submission.formVersion) return form;
    const snapshot = stored.get(`${submission.formId}:${submission.formVersion}`);
    if (!snapshot) return form;
    const { content, translations } = JSON.parse(snapshot) as Snapshot<FormContent>;
    return { ...form, ...formColumns(content), translations };
  };
}

// Shorthand for one submission.
export async function testAsAnswered<T extends Test>(test: T, submission: { testId: string; testVersion: number }) {
  return (await testsAsAnswered([test], [submission]))(submission) ?? test;
}

export async function formAsAnswered<T extends Form>(form: T, submission: { formId: string; formVersion: number }) {
  return (await formsAsAnswered([form], [submission]))(submission) ?? form;
}

// As testsAsAnswered, translated into the viewer's language; each version is translated once.
export async function localizedTestsAsAnswered<T extends Test>(
  tests: T[],
  submissions: { testId: string; testVersion: number }[],
  locale: string
) {
  const lookup = await testsAsAnswered(tests, submissions);
  const cache = new Map<string, T>();
  return (submission: { testId: string; testVersion: number }): T | undefined => {
    const key = `${submission.testId}:${submission.testVersion}`;
    if (!cache.has(key)) {
      const test = lookup(submission);
      if (!test) return undefined;
      cache.set(key, localizeTest(test, locale));
    }
    return cache.get(key);
  };
}
