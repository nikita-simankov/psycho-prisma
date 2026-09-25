"use server";

import { signInSchema } from "@/app/auth/sign-in/schema/sign-in.schema";
import { homePath } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { consumeRateLimit } from "@/utils/rate-limit";
import { normalizePhone, rememberOrganization, startSession } from "@/utils/session";
import { compare } from "bcryptjs";
import { headers } from "next/headers";

// Compared against when the account is unknown, so both paths take the same time.
const DUMMY_HASH = "$2a$10$tpMTjOqMdk5cAjXejhc8qOlegoxIr8QhGT/VE5n22td9Vv3ZYolbC";

export async function signIn(
  data: unknown
): Promise<{ redirectTo: string } | { error: "invalidCredentials" | "rateLimited" }> {
  const parsed = signInSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "invalidCredentials" };
  }

  const { identifier, password } = parsed.data;
  const where = identifier.includes("@")
    ? { email: identifier.toLowerCase() }
    : { phoneNumber: normalizePhone(identifier) };
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  if (
    !consumeRateLimit(`sign-in:account:${Object.values(where)[0]}`, 5, 15 * 60_000) ||
    !consumeRateLimit(`sign-in:ip:${ip}`, 30, 15 * 60_000)
  ) {
    return { error: "rateLimited" };
  }

  const existingUser = await prisma.user.findUnique({
    where,
    select: {
      id: true,
      password: true,
      memberships: { select: { role: true, organization: { select: { slug: true } } }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  });

  const passwordMatches = await compare(password, existingUser?.password ?? DUMMY_HASH);

  if (!existingUser || !passwordMatches) {
    return { error: "invalidCredentials" };
  }

  await startSession(existingUser.id);

  const [membership] = existingUser.memberships;

  if (membership) {
    rememberOrganization(membership.organization.slug);
  }

  return { redirectTo: homePath(membership ?? null) };
}
