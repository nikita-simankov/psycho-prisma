import "server-only";

import { renderEmail } from "@/emails/render";
import { prisma } from "./database";
import { sendHeldInvitations } from "./invitations";
import { absoluteUrl, sendMail } from "./mail";
import { createToken, hashToken } from "./tokens";
import { getTranslations } from "next-intl/server";

const VERIFICATION_HOURS = 48;

// Emails a fresh confirmation link; earlier links stop working.
export async function sendVerificationEmail(user: { id: string; email: string | null }) {
  if (!user.email) {
    return false;
  }

  const { token, tokenHash } = createToken();
  await prisma.$transaction([
    prisma.emailVerification.deleteMany({ where: { userId: user.id } }),
    prisma.emailVerification.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + VERIFICATION_HOURS * 60 * 60_000) },
    }),
  ]);

  const t = await getTranslations("mail.verify");
  const link = await absoluteUrl(`/verify-email/${token}`);
  const content = await renderEmail({
    preview: t("preview"),
    sender: "Calibre",
    heading: t("heading"),
    paragraphs: [t("body")],
    action: { label: t("action"), url: link },
    notes: [t("expires", { hours: VERIFICATION_HOURS }), t("ignore")],
  });

  return sendMail({ to: user.email, subject: t("subject"), ...content });
}

// Confirms the address behind a link. Returns the user id, or null for an unknown or expired link.
export async function confirmEmail(token: string) {
  const verification = await prisma.emailVerification.findUnique({ where: { tokenHash: hashToken(token) } });

  if (!verification || verification.expiresAt < new Date()) {
    return null;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: verification.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.emailVerification.deleteMany({ where: { userId: verification.userId } }),
  ]);
  // Invitations saved during /start go out now.
  await sendHeldInvitations(verification.userId);

  return verification.userId;
}
