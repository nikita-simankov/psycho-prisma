"use server";

import { signUpSchema } from "@/app/auth/sign-up/schema/sign-up.schema";
import { prisma } from "@/utils/database";
import { consumeRateLimit } from "@/utils/rate-limit";
import { sendVerificationEmail } from "@/utils/email-verification";
import { createOwnedOrganization, isOrganizationNameTaken } from "@/utils/organizations";
import { rememberOrganization, startSession } from "@/utils/session";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { getLocale } from "next-intl/server";
import { headers } from "next/headers";

type SignUpError = "rateLimited" | "invalidInput" | "emailTaken" | "organizationTaken";

// Creates an account and the organization it owns, then signs the person in.
export async function signUp(data: unknown): Promise<{ redirectTo: string } | { error: SignUpError }> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  if (!consumeRateLimit(`sign-up:ip:${ip}`, 10, 60 * 60_000)) {
    return { error: "rateLimited" };
  }

  const parsed = signUpSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "invalidInput" };
  }

  const { password, consent: _consent, organization, ...profile } = parsed.data;

  if (await prisma.user.findUnique({ where: { email: profile.email }, select: { id: true } })) {
    return { error: "emailTaken" };
  }

  if (await isOrganizationNameTaken(organization)) {
    return { error: "organizationTaken" };
  }

  const user = await prisma.user.create({
    data: { ...profile, id: randomUUID(), password: await hash(password, 10), locale: await getLocale() },
  });

  const created = await createOwnedOrganization(user.id, organization);
  // Sending invitations and rounds waits for this; everything else works right away.
  await sendVerificationEmail(user);

  await startSession(user.id);
  await rememberOrganization(created.slug);

  return { redirectTo: `/${created.slug}` };
}
