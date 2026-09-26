import "server-only";

import { renderEmail } from "@/emails/render";
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "@/i18n/config";
import { createTranslator } from "next-intl";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import enMessages from "../../messages/en.json";
import ruMessages from "../../messages/ru.json";
import type { Context } from "./authentication";
import { checkSeat } from "./billing";
import { prisma } from "./database";
import { absoluteUrl, sendMail } from "./mail";
import { assignableRoles } from "./roles";
import { createToken } from "./tokens";

export const INVITATION_DAYS = 14;

const invitationSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().max(100).default(""),
  lastName: z.string().trim().max(100).default(""),
  role: z.string(),
  teamId: z.string().nullable().default(null),
  position: z.string().trim().max(200).default(""),
  // Language of the invitation email; defaults to the inviter's.
  locale: z.enum(LOCALES).optional(),
});

export type InvitationResult = { link: string; emailed: boolean } | { error: "alreadyMember" | "planSeats" | "emailUnverified" };

type Inviter = Context;

type InvitationMail = {
  organization: string;
  email: string;
  token: string;
  role: string;
  inviter: string;
  locale: string;
};

// The invitation email, in the language the inviter chose. It says who invited the person, with
// which role, and what that role can do, so a new psychologist isn't told they'll "take tests".
export async function mailInvitation({ organization, email, token, role, inviter, locale }: InvitationMail) {
  const chosen: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const t = createTranslator({
    locale: chosen,
    messages: chosen === "ru" ? ruMessages : enMessages,
    namespace: "mail.invitation",
  });
  const roleName = (chosen === "ru" ? ruMessages : enMessages).roles[role as keyof typeof enMessages.roles] ?? role;
  const described = (["owner", "admin", "psychologist", "manager"] as const).find((r) => r === role) ?? "member";
  const roleText = t(`roles.${described}`, { organization });
  const link = await absoluteUrl(`/invite/${token}`);
  const content = await renderEmail({
    preview: t("preview", { organization, inviter }),
    sender: organization,
    heading: t("heading", { organization }),
    paragraphs: [t("body", { organization, inviter, role: roleName }), roleText],
    action: { label: t("action"), url: link },
    notes: [t("expires", { days: INVITATION_DAYS }), t("ignore")],
  });
  const emailed = await sendMail({ to: email, subject: t("subject", { organization, inviter }), ...content });
  return { link, emailed };
}

export function inviterName(user: { name: string; lastName: string; email: string | null }) {
  return [user.name, user.lastName].filter(Boolean).join(" ") || user.email || "";
}

// Creates an invitation and emails it. Unconfirmed accounts can't email other people, so a
// made-up sign-up can't be used to send mail: their invitations are refused, or, with
// `holdIfUnverified` (the /start welcome), saved and sent once the address is confirmed.
export async function invite(
  { user, membership, organization }: Inviter,
  data: unknown,
  { holdIfUnverified = false } = {}
): Promise<InvitationResult | { held: true }> {
  const invitation = invitationSchema.parse(data);
  const held = !user.emailVerifiedAt;

  if (held && !holdIfUnverified) {
    return { error: "emailUnverified" };
  }

  if (!assignableRoles(membership.role).includes(invitation.role as never)) {
    throw new Error("You cannot give this role");
  }

  if (invitation.teamId) {
    await prisma.team.findFirstOrThrow({ where: { id: invitation.teamId, organizationId: organization.id } });
  }

  const existing = await prisma.membership.findFirst({
    where: { organizationId: organization.id, user: { email: invitation.email } },
  });

  if (existing) {
    return { error: "alreadyMember" };
  }

  if (!(await checkSeat(organization.id, invitation.role, invitation.email))) {
    return { error: "planSeats" };
  }

  // A new invitation replaces any open one for the same address.
  await prisma.invitation.deleteMany({
    where: { organizationId: organization.id, email: invitation.email, acceptedAt: null },
  });

  const { token, tokenHash } = createToken();
  const locale = invitation.locale ?? (await getLocale());

  await prisma.invitation.create({
    data: {
      ...invitation,
      locale,
      held,
      tokenHash,
      organizationId: organization.id,
      invitedById: user.id,
      expiresAt: new Date(Date.now() + INVITATION_DAYS * 24 * 60 * 60_000),
    },
  });

  if (held) {
    return { held: true };
  }

  return mailInvitation({
    organization: organization.name,
    email: invitation.email,
    token,
    role: invitation.role,
    inviter: inviterName(user),
    locale,
  });
}

// Sends the invitations someone saved before confirming their email, each with a fresh link.
export async function sendHeldInvitations(userId: string) {
  const [held, inviter] = await Promise.all([
    prisma.invitation.findMany({
      where: { invitedById: userId, held: true, acceptedAt: null },
      include: { organization: { select: { name: true } } },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, lastName: true, email: true } }),
  ]);

  for (const invitation of held) {
    const { token, tokenHash } = createToken();
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { tokenHash, held: false, expiresAt: new Date(Date.now() + INVITATION_DAYS * 24 * 60 * 60_000) },
    });
    await mailInvitation({
      organization: invitation.organization.name,
      email: invitation.email,
      token,
      role: invitation.role,
      inviter: inviterName(inviter),
      locale: invitation.locale,
    });
  }
}

