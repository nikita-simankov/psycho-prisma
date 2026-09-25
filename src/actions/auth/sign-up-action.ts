"use server";

import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/utils/database";
import { consumeRateLimit } from "@/utils/rate-limit";
import {
  credentialsSchema,
  generalInfoSchema,
  workInfoSchema,
} from "@/app/auth/sign-up/schema/sign-up.schema";
import { headers } from "next/headers";

// Whitelists every field a new account may set. Role is always "user".
const signUpSchema = generalInfoSchema
  .merge(workInfoSchema)
  .merge(credentialsSchema)
  .strip();

type SignUpError = "rateLimited" | "invalidInput" | "phoneTaken";

export async function signUp(data: unknown): Promise<{ ok: true } | { error: SignUpError }> {
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  if (!consumeRateLimit(`sign-up:ip:${ip}`, 10, 60 * 60_000)) {
    return { error: "rateLimited" };
  }

  const parsed = signUpSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "invalidInput" };
  }

  const { password, ...profile } = parsed.data;

  const userExists = await prisma.user.findUnique({
    where: { phoneNumber: profile.phoneNumber },
    select: { id: true },
  });

  if (userExists) {
    return { error: "phoneTaken" };
  }

  await prisma.user.create({
    data: {
      ...profile,
      id: randomUUID(),
      role: "user",
      password: await hash(password, 10),
    },
  });

  return { ok: true };
}
