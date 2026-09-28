"use server";

import { auditAs } from "@/utils/audit";
import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { isHiringCandidate, shareableResults } from "@/utils/hiring";
import { absoluteUrl } from "@/utils/mail";
import { consumeRateLimit, requestIp } from "@/utils/rate-limit";
import {
  ACCESS_HOURS,
  checkShareCode,
  createAccessCode,
  hashAccessCode,
  normalizeCode,
  SHARE_COOKIE,
  SHARE_MAX_DAYS,
  SHARE_MIN_DAYS,
  shareExpiry,
} from "@/utils/share-links";
import { createToken, hashToken } from "@/utils/tokens";
import { getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { z } from "zod";

const shareSchema = z
  .object({
    userId: z.string().min(1),
    days: z.number().int().min(SHARE_MIN_DAYS).max(SHARE_MAX_DAYS),
    recipient: z.string().trim().max(120).default(""),
    includeConclusion: z.boolean().default(true),
  })
  .strict();

export type CreateShareResult =
  | { ok: true; link: string; code: string; expiresAt: Date }
  | { error: "notCandidate" | "noResults" };

// Makes a link to one candidate's report. The link and its code are returned once and never again:
// only their hashes are kept.
export async function createReportShare(data: unknown): Promise<CreateShareResult> {
  const context = await requireMember("viewIndividualResults");
  const input = shareSchema.parse(data);
  const organizationId = context.organization.id;

  if (!(await isHiringCandidate(organizationId, input.userId))) {
    return { error: "notCandidate" };
  }
  const results = await shareableResults(organizationId, input.userId, await getLocale());
  if (!results.length) {
    return { error: "noResults" };
  }

  const { token, tokenHash } = createToken();
  const code = createAccessCode();
  const share = await prisma.reportShare.create({
    data: {
      organizationId,
      userId: input.userId,
      tokenHash,
      codeHash: hashAccessCode(code),
      recipient: input.recipient,
      submissionIds: JSON.stringify(results.map((result) => result.id)),
      includeConclusion: input.includeConclusion,
      expiresAt: shareExpiry(input.days),
      createdById: context.user.id,
    },
  });
  await auditAs(context, "createReportShare", { subjectId: input.userId, detail: { shareId: share.id, days: input.days, recipient: input.recipient || null } });

  return { ok: true, link: await absoluteUrl(`/share/${token}`), code, expiresAt: share.expiresAt };
}

export async function revokeReportShare(id: string) {
  const context = await requireMember("viewIndividualResults");
  const share = await prisma.reportShare.findFirst({ where: { id: z.string().min(1).parse(id), organizationId: context.organization.id } });

  if (share && !share.revokedAt) {
    await prisma.reportShare.update({ where: { id: share.id }, data: { revokedAt: new Date() } });
    await auditAs(context, "revokeReportShare", { subjectId: share.userId, detail: { shareId: share.id, recipient: share.recipient || null } });
  }
  return { ok: true };
}

export type OpenShareResult = { ok: true } | { error: "wrong" | "locked" | "expired" | "revoked" | "notFound" | "tooMany" };

// For the recipient, who has no account: checks the access code and, when it is right, keeps the
// link open in this browser for a while. Wrong codes count against the link and the address.
export async function openSharedReport(token: string, code: string): Promise<OpenShareResult> {
  const ip = await requestIp();
  if (!consumeRateLimit(`share-code:ip:${ip}`, 30, 15 * 60_000)) {
    return { error: "tooMany" };
  }

  // Tokens are base64url; anything else can't be a link and never reaches the cookie's path.
  const share = /^[\w-]{20,100}$/.test(String(token)) ? await prisma.reportShare.findUnique({ where: { tokenHash: hashToken(token) } }) : null;
  if (!share) {
    return { error: "notFound" };
  }

  const now = new Date();
  const check = checkShareCode(share, String(code).slice(0, 20), now);
  if (check.update) {
    await prisma.reportShare.update({ where: { id: share.id }, data: check.update });
  }
  if (check.outcome !== "ok") {
    return { error: check.outcome };
  }

  (await cookies()).set(SHARE_COOKIE, normalizeCode(String(code)), {
    path: `/share/${token}`,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(Math.min(ACCESS_HOURS * 3_600_000, share.expiresAt.getTime() - now.getTime()) / 1000),
  });
  return { ok: true };
}
