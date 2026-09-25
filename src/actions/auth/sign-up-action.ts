"use server";

import { signUpSchema } from "@/app/auth/sign-up/schema/sign-up.schema";
import { prisma } from "@/utils/database";
import { consumeRateLimit } from "@/utils/rate-limit";
import { createOwnedOrganization } from "@/utils/organizations";
import { rememberOrganization, startSession } from "@/utils/session";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { headers } from "next/headers";

type SignUpError = "rateLimited" | "invalidInput" | "emailTaken";

// Creates an account and the organization it owns, then signs the person in.
export async function signUp(data: unknown): Promise<{ ok: true } | { error: SignUpError }> {
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

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

  const user = await prisma.user.create({
    data: { ...profile, id: randomUUID(), password: await hash(password, 10) },
  });

  const created = await createOwnedOrganization(user.id, organization);

  await startSession(user.id);
  rememberOrganization(created.id);

  return { ok: true };
}
