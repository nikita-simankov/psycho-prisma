import "server-only";

import type { Context } from "./authentication";
import { prisma } from "./database";

export const AUDIT_ACTIONS = [
  // Opening individual results.
  "viewTestResult",
  "viewFormResult",
  "viewReport",
  "viewReportVersion",
  "saveReportVersion",
  // People and roles.
  "changeMembership",
  "changeFlag",
  "removeMember",
  "leaveOrganization",
  "transferOwnership",
  "changeSettings",
  // Personal data.
  "exportPersonalData",
  "withdrawConsent",
  "retentionCleanup",
  // Library.
  "publishInstrument",
  // Plan and billing.
  "changePlan",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

// Only identifiers go in the detail, never answers or scores.
type Detail = Record<string, string | number | boolean | null>;

// Records an event. Failures are logged and never stop the action being audited.
export async function audit(
  organizationId: string,
  actorId: string | null,
  action: AuditAction,
  options: { subjectId?: string | null; detail?: Detail } = {}
) {
  try {
    await prisma.auditEvent.create({
      data: {
        organizationId,
        actorId,
        action,
        subjectId: options.subjectId ?? null,
        detail: JSON.stringify(options.detail ?? {}),
      },
    });
  } catch (error) {
    console.error("Audit event not recorded", action, error);
  }
}

// Shorthand for an event by the signed-in person in the active organization.
export function auditAs(context: Pick<Context, "organization" | "user">, action: AuditAction, options?: Parameters<typeof audit>[3]) {
  return audit(context.organization.id, context.user.id, action, options);
}

// Audit events are kept for two years.
export const AUDIT_RETENTION_MONTHS = 24;
