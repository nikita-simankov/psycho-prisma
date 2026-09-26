"use server";

import { auditAs } from "@/utils/audit";
import { AuthorizationError, requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import {
  blankForm,
  blankTest,
  formColumns,
  formContentOf,
  testColumns,
  testContentOf,
  validateFormContent,
  validateTestContent,
  pruneOverlays,
  type FormContent,
  type Issue,
  type TestContent,
} from "@/utils/instrument-content";
import { formContentSchema, testContentSchema } from "@/utils/instrument-schema";
import { snapshotOf } from "@/utils/instrument-versions";
import { libraryWhere } from "@/utils/library";
import { can } from "@/utils/roles";
import type { Form, Test } from "@prisma/client";
import { localizeForm, localizeTest } from "@/utils/content-translation";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";

const kindSchema = z.enum(["test", "form"]);
type Kind = z.infer<typeof kindSchema>;

function table(kind: Kind) {
  // Both delegates share the calls used here; the casts keep one code path for both kinds.
  return (kind === "test" ? prisma.test : prisma.form) as unknown as typeof prisma.test;
}

// An instrument the active organization owns and the signed-in person may edit.
async function editable(kindValue: unknown, idValue: unknown) {
  const kind = kindSchema.parse(kindValue);
  const context = await requireMember("manageLibrary");
  const row = (await table(kind).findFirst({
    where: { id: z.string().parse(idValue), organizationId: context.organization.id },
  })) as (Test | Form) | null;

  if (!row) throw new AuthorizationError("Not found");
  if (kind === "test" && (row as Test).sensitive && !can(context.membership.role, "viewSensitive")) {
    throw new AuthorizationError("Forbidden");
  }

  return { kind, context, row };
}

// Names are unique among what one organization sees: the shared library and its own instruments.
async function nameTaken(kind: Kind, name: string, organizationId: string, exceptId?: string) {
  const found = await table(kind).findFirst({
    where: {
      name: name.trim(),
      OR: [{ organizationId: null }, { organizationId }],
      ...(exceptId && { id: { not: exceptId } }),
    },
    select: { id: true },
  });
  return found !== null;
}

function withoutNames(translations: string) {
  try {
    const overlays = JSON.parse(translations) as Record<string, { name?: string }>;
    return JSON.stringify(Object.fromEntries(Object.entries(overlays).map(([locale, { name: _name, ...overlay }]) => [locale, overlay])));
  } catch {
    return "{}";
  }
}

async function freeName(kind: Kind, base: string, organizationId: string) {
  let name = base;
  for (let copy = 2; await nameTaken(kind, name, organizationId); copy++) name = `${base} ${copy}`;
  return name;
}

function contentOf(kind: Kind, row: Test | Form): TestContent | FormContent {
  return kind === "test" ? testContentOf(row as Test) : formContentOf(row as Form);
}

function columnsOf(kind: Kind, content: TestContent | FormContent) {
  return kind === "test" ? testColumns(content as TestContent) : formColumns(content as FormContent);
}

function draftOf(kind: Kind, row: Test | Form): TestContent | FormContent {
  if (!row.draft) return contentOf(kind, row);
  const parsed = JSON.parse(row.draft);
  return kind === "test" ? testContentSchema.parse(parsed) : formContentSchema.parse(parsed);
}

// Starts a new, unpublished instrument and returns its id for the editor.
export async function createInstrument(kindValue: unknown, nameValue: unknown) {
  const kind = kindSchema.parse(kindValue);
  const { organization } = await requireMember("manageLibrary");
  const name = await freeName(kind, z.string().trim().min(1).max(200).parse(nameValue), organization.id);
  const content = kind === "test" ? blankTest(name) : blankForm(name);

  const created = await table(kind).create({
    data: { ...(columnsOf(kind, content) as ReturnType<typeof testColumns>), organizationId: organization.id, version: 0, draft: JSON.stringify(content) },
  });
  return { id: created.id };
}

// Copies a library instrument into the organization as an unpublished draft to edit.
export async function copyInstrument(kindValue: unknown, idValue: unknown) {
  const kind = kindSchema.parse(kindValue);
  const { organization, membership } = await requireMember("manageLibrary");
  const source = (await table(kind).findFirst({
    where: { id: z.string().parse(idValue), AND: [libraryWhere(organization.id)] },
  })) as (Test | Form) | null;

  if (!source) throw new AuthorizationError("Not found");
  const sensitive = kind === "test" && (source as Test).sensitive;
  if (sensitive && !can(membership.role, "viewSensitive")) throw new AuthorizationError("Forbidden");

  // The copy is named in the language of whoever made it, and that name is its own in every
  // language: the source's translated names would otherwise hide it.
  const locale = await getLocale();
  const t = await getTranslations("studio");
  const sourceName = (kind === "test" ? localizeTest(source as Test, locale) : localizeForm(source as Form, locale)).name;
  const content = { ...contentOf(kind, source), name: await freeName(kind, t("copyName", { name: sourceName }), organization.id) };
  const created = await table(kind).create({
    data: {
      ...(columnsOf(kind, content) as ReturnType<typeof testColumns>),
      translations: withoutNames(source.translations),
      organizationId: organization.id,
      version: 0,
      draft: JSON.stringify(content),
      copiedFromId: source.id,
      ...(kind === "test" && { sensitive, retestDays: (source as Test).retestDays }),
    },
  });
  return { id: created.id };
}

// Keeps the editor's work as it is typed. Nothing changes for respondents until it is published.
export async function saveInstrumentDraft(kindValue: unknown, idValue: unknown, contentValue: unknown) {
  const { kind, row } = await editable(kindValue, idValue);
  const content = kind === "test" ? testContentSchema.parse(contentValue) : formContentSchema.parse(contentValue);
  const saved = await table(kind).update({ where: { id: row.id }, data: { draft: JSON.stringify(content) } });
  return { savedAt: saved.updatedAt };
}

export async function discardInstrumentDraft(kindValue: unknown, idValue: unknown) {
  const { kind, row } = await editable(kindValue, idValue);
  if (row.version === 0) {
    // Never published: nothing to go back to, so the instrument goes.
    await table(kind).delete({ where: { id: row.id } });
    return { deleted: true };
  }
  await table(kind).update({ where: { id: row.id }, data: { draft: "" } });
  return { deleted: false };
}

export async function publishInstrument(
  kindValue: unknown,
  idValue: unknown,
  noteValue: unknown
): Promise<{ ok: true; version: number } | { error: "invalid"; issues: Issue[] } | { error: "nameTaken" | "noChanges" }> {
  const { kind, context, row } = await editable(kindValue, idValue);
  const note = z.string().trim().max(500).parse(noteValue ?? "");
  if (!row.draft) return { error: "noChanges" };

  const content = draftOf(kind, row);
  const issues = kind === "test" ? validateTestContent(content as TestContent) : validateFormContent(content as FormContent);
  if (issues.length > 0) return { error: "invalid", issues };
  if (await nameTaken(kind, content.name, context.organization.id, row.id)) return { error: "nameTaken" };

  const before = contentOf(kind, row);
  const version = row.version + 1;
  const columns = columnsOf(kind, content) as ReturnType<typeof testColumns>;
  const translations = pruneOverlays(before as TestContent, content as TestContent, row.translations);

  await prisma.$transaction(async (tx) => {
    const versions = tx.instrumentVersion;
    // Versions published before the studio existed have no snapshot yet; keep the current one.
    if (row.version > 0 && !(await versions.findUnique({ where: { kind_instrumentId_version: { kind, instrumentId: row.id, version: row.version } } }))) {
      await versions.create({ data: { kind, instrumentId: row.id, version: row.version, content: snapshotOf(kind, row) } });
    }
    const updated = await (kind === "test" ? tx.test : (tx.form as unknown as typeof tx.test)).update({
      where: { id: row.id },
      data: { ...columns, translations, version, draft: "" },
    });
    await versions.create({
      data: { kind, instrumentId: row.id, version, content: snapshotOf(kind, updated), note, createdById: context.user.id },
    });
  });

  await auditAs(context, "publishInstrument", { detail: { [kind === "test" ? "testId" : "formId"]: row.id, version } });
  return { ok: true, version };
}

// Loads an earlier version into the draft, to publish again as a new version.
export async function restoreInstrumentVersion(kindValue: unknown, idValue: unknown, versionValue: unknown) {
  const { kind, row } = await editable(kindValue, idValue);
  const snapshot = await prisma.instrumentVersion.findUniqueOrThrow({
    where: { kind_instrumentId_version: { kind, instrumentId: row.id, version: z.number().int().parse(versionValue) } },
  });
  const { content } = JSON.parse(snapshot.content);
  await table(kind).update({ where: { id: row.id }, data: { draft: JSON.stringify(content) } });
}

// Test settings outside the versioned content.
export async function updateTestSettings(idValue: unknown, data: unknown) {
  const { context, row } = await editable("test", idValue);
  const settings = z
    .object({ sensitive: z.boolean(), retestDays: z.number().int().min(0).max(3650) })
    .partial()
    .strict()
    .parse(data);
  if (settings.sensitive !== undefined && !can(context.membership.role, "viewSensitive")) {
    throw new AuthorizationError("Forbidden");
  }
  await prisma.test.update({ where: { id: row.id }, data: settings });
}
