import "server-only";

import { ensureMember, type Context } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { formContentSchema, testContentSchema } from "@/utils/instrument-schema";
import { formContentOf, testContentOf, type InstrumentKind } from "@/utils/instrument-content";
import { can } from "@/utils/roles";
import type { Form, Test } from "@prisma/client";
import { notFound } from "next/navigation";

// Whether this person may open the studio for an instrument: their organization owns it and
// they manage the library (and, for a sensitive test, may see sensitive ones).
export function canEdit(context: Pick<Context, "organization" | "membership">, row: { organizationId: string | null; sensitive?: boolean }) {
  return (
    row.organizationId === context.organization.id &&
    can(context.membership.role, "manageLibrary") &&
    (!row.sensitive || can(context.membership.role, "viewSensitive"))
  );
}

// For the studio pages: the organization's own test, or a 404.
export async function loadEditableTest(id: string) {
  const context = await ensureMember("manageLibrary");
  const row = await prisma.test.findFirst({ where: { id, organizationId: context.organization.id } });
  if (!row || !canEdit(context, row)) notFound();
  return { context, row, content: row.draft ? testContentSchema.parse(JSON.parse(row.draft)) : testContentOf(row) };
}

export async function loadEditableForm(id: string) {
  const context = await ensureMember("manageLibrary");
  const row = await prisma.form.findFirst({ where: { id, organizationId: context.organization.id } });
  if (!row || !canEdit(context, row)) notFound();
  return { context, row, content: row.draft ? formContentSchema.parse(JSON.parse(row.draft)) : formContentOf(row) };
}

// The organization's instruments that have unpublished work: new ones and edited ones.
export async function findDrafts(kind: InstrumentKind, context: Pick<Context, "organization" | "membership">) {
  const where = { organizationId: context.organization.id, OR: [{ version: 0 }, { draft: { not: "" } }] };
  const select = { id: true, name: true, version: true, draft: true, updatedAt: true };
  if (kind === "form") {
    const rows = await prisma.form.findMany({ where, select, orderBy: { updatedAt: "desc" } });
    return rows.map(withDraftName);
  }
  const rows = await prisma.test.findMany({
    where: { ...where, ...(!can(context.membership.role, "viewSensitive") && { sensitive: false }) },
    select,
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(withDraftName);
}

function withDraftName(row: Pick<Test | Form, "id" | "name" | "version" | "draft" | "updatedAt">) {
  let name = row.name;
  try {
    name = row.draft ? (JSON.parse(row.draft).name as string) || row.name : row.name;
  } catch {}
  return { id: row.id, name, version: row.version, updatedAt: row.updatedAt };
}
