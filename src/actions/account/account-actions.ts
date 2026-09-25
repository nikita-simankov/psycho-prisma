"use server";

import { emailSchema, passwordSchema } from "@/app/auth/sign-up/schema/sign-up.schema";
import { lucia, requireUser } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { consumeRateLimit } from "@/utils/rate-limit";
import { normalizePhone } from "@/utils/session";
import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";

const profileSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    middleName: z.string().trim().max(100),
    lastName: z.string().trim().min(1).max(100),
    phoneNumber: z.string().trim().max(30),
  })
  .strict();

export async function updateProfile(data: unknown): Promise<{ ok: true } | { error: "phoneTaken" | "invalidInput" }> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "invalidInput" };
  }

  const phoneNumber = parsed.data.phoneNumber ? normalizePhone(parsed.data.phoneNumber) : null;

  if (phoneNumber) {
    const owner = await prisma.user.findUnique({ where: { phoneNumber }, select: { id: true } });
    if (owner && owner.id !== user.id) {
      return { error: "phoneTaken" };
    }
  }

  await prisma.user.update({ where: { id: user.id }, data: { ...parsed.data, phoneNumber } });
  return { ok: true };
}

// Checks the current password; limited so it can't be guessed from a stolen session.
async function verifyPassword(userId: string, password: unknown) {
  if (!consumeRateLimit(`account-password:${userId}`, 10, 15 * 60_000)) {
    return "rateLimited" as const;
  }

  const account = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { password: true } });
  return (await compare(z.string().max(128).parse(password), account.password)) ? null : ("wrongPassword" as const);
}

export async function changeEmail(
  email: unknown,
  currentPassword: unknown
): Promise<{ ok: true } | { error: "wrongPassword" | "rateLimited" | "emailTaken" | "invalidInput" }> {
  const user = await requireUser();
  const parsed = emailSchema.safeParse(email);

  if (!parsed.success) {
    return { error: "invalidInput" };
  }

  const failure = await verifyPassword(user.id, currentPassword);
  if (failure) {
    return { error: failure };
  }

  const owner = await prisma.user.findUnique({ where: { email: parsed.data }, select: { id: true } });
  if (owner && owner.id !== user.id) {
    return { error: "emailTaken" };
  }

  await prisma.user.update({ where: { id: user.id }, data: { email: parsed.data } });
  return { ok: true };
}

// Changes the password and signs out every other session of this account.
export async function changePassword(
  currentPassword: unknown,
  newPassword: unknown
): Promise<{ ok: true } | { error: "wrongPassword" | "rateLimited" | "invalidInput" }> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse(newPassword);

  if (!parsed.success) {
    return { error: "invalidInput" };
  }

  const failure = await verifyPassword(user.id, currentPassword);
  if (failure) {
    return { error: failure };
  }

  await prisma.user.update({ where: { id: user.id }, data: { password: await hash(parsed.data, 10) } });

  const currentSession = cookies().get(lucia.sessionCookieName)?.value;
  await prisma.session.deleteMany({ where: { userId: user.id, NOT: { id: currentSession } } });

  return { ok: true };
}

// Leaves an organization. Answers given there are deleted with the membership, as when
// an admin removes someone. The last owner has to transfer ownership first.
export async function leaveOrganization(organizationId: unknown): Promise<{ ok: true } | { error: "lastOwner" }> {
  const user = await requireUser();
  const id = z.string().parse(organizationId);
  const membership = await prisma.membership.findUniqueOrThrow({
    where: { userId_organizationId: { userId: user.id, organizationId: id } },
  });

  if (membership.role === "owner") {
    const owners = await prisma.membership.count({ where: { organizationId: id, role: "owner" } });
    if (owners === 1) {
      return { error: "lastOwner" };
    }
  }

  const scope = { userId: user.id, organizationId: id };
  await prisma.$transaction([
    prisma.testSubmission.deleteMany({ where: scope }),
    prisma.formSubmission.deleteMany({ where: scope }),
    prisma.userSummary.deleteMany({ where: scope }),
    prisma.membership.delete({ where: { id: membership.id } }),
  ]);

  return { ok: true };
}
