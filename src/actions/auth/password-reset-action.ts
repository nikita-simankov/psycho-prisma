"use server";

import { emailSchema, passwordSchema } from "@/app/auth/sign-up/schema/sign-up.schema";
import { homePath, lucia } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { renderEmail } from "@/emails/render";
import { absoluteUrl, sendMail } from "@/utils/mail";
import { consumeRateLimit } from "@/utils/rate-limit";
import { rememberOrganization, startSession } from "@/utils/session";
import { createToken, hashToken } from "@/utils/tokens";
import { hash } from "bcryptjs";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

const RESET_MINUTES = 60;

// Always reports success so the form does not reveal which emails have accounts.
export async function requestPasswordReset(email: unknown): Promise<{ ok: true } | { error: "rateLimited" }> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const parsed = emailSchema.safeParse(email);

  if (!consumeRateLimit(`reset:ip:${ip}`, 10, 60 * 60_000)) {
    return { error: "rateLimited" };
  }

  if (!parsed.success || !consumeRateLimit(`reset:email:${parsed.data}`, 3, 60 * 60_000)) {
    return { ok: true };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data }, select: { id: true } });

  if (user) {
    const { token, tokenHash } = createToken();

    await prisma.passwordReset.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000) },
    });

    const t = await getTranslations("mail.passwordReset");
    const link = await absoluteUrl(`/auth/reset-password/${token}`);

    const content = await renderEmail({
      preview: t("preview"),
      sender: "Calibre",
      heading: t("heading"),
      paragraphs: [t("body")],
      action: { label: t("action"), url: link },
      notes: [t("expires", { minutes: RESET_MINUTES }), t("ignore")],
    });
    await sendMail({ to: parsed.data, subject: t("subject"), ...content });
  }

  return { ok: true };
}

export async function findPasswordReset(token: string) {
  const reset = await prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(token) } });
  return Boolean(reset && !reset.usedAt && reset.expiresAt > new Date());
}

// Sets a new password, signs out every other session and signs this browser in.
export async function resetPassword(
  token: string,
  password: unknown
): Promise<{ redirectTo: string } | { error: "invalidLink" | "invalidInput" }> {
  const parsedPassword = passwordSchema.safeParse(password);

  if (!parsedPassword.success) {
    return { error: "invalidInput" };
  }

  const reset = await prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(token) } });

  if (!reset || reset.usedAt || reset.expiresAt <= new Date()) {
    return { error: "invalidLink" };
  }

  await prisma.$transaction([
    // The reset link reached this inbox, which confirms the address.
    prisma.user.update({
      where: { id: reset.userId },
      data: { password: await hash(parsedPassword.data, 10), emailVerifiedAt: new Date() },
    }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
  ]);

  await lucia.invalidateUserSessions(reset.userId);
  await startSession(reset.userId);

  const membership = await prisma.membership.findFirst({
    where: { userId: reset.userId },
    orderBy: { createdAt: "asc" },
    include: { organization: { select: { slug: true } } },
  });

  if (membership) {
    await rememberOrganization(membership.organization.slug);
  }

  return { redirectTo: homePath(membership) };
}
