"use server";

import { prisma } from "@/utils/database";
import { lucia } from "@/utils/authentication";
import { consumeRateLimit } from "@/utils/rate-limit";
import { signInSchema } from "@/app/auth/sign-in/schema/sign-in.schema";
import { compare } from "bcryptjs";
import { cookies, headers } from "next/headers";

// Compared against when the phone number is unknown, so both paths take the same time.
const DUMMY_HASH = "$2a$10$tpMTjOqMdk5cAjXejhc8qOlegoxIr8QhGT/VE5n22td9Vv3ZYolbC";

export async function signIn(
  data: unknown
): Promise<{ role: string } | { error: "invalidCredentials" | "rateLimited" }> {
  const parsed = signInSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "invalidCredentials" };
  }

  const { phoneNumber, password } = parsed.data;
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  if (
    !consumeRateLimit(`sign-in:phone:${phoneNumber}`, 5, 15 * 60_000) ||
    !consumeRateLimit(`sign-in:ip:${ip}`, 30, 15 * 60_000)
  ) {
    return { error: "rateLimited" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { phoneNumber },
    select: { id: true, role: true, password: true },
  });

  const passwordMatches = await compare(
    password,
    existingUser?.password ?? DUMMY_HASH
  );

  if (!existingUser || !passwordMatches) {
    return { error: "invalidCredentials" };
  }

  const session = await lucia.createSession(existingUser.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  return { role: existingUser.role };
}
