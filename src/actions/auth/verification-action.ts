"use server";

import { requireUser } from "@/utils/authentication";
import { sendVerificationEmail } from "@/utils/email-verification";
import { consumeRateLimit } from "@/utils/rate-limit";

// "Send the link again" on the confirmation banner.
export async function resendVerification(): Promise<{ ok: true; emailed: boolean } | { error: "rateLimited" }> {
  const user = await requireUser();

  if (user.emailVerifiedAt) {
    return { ok: true, emailed: false };
  }

  if (!consumeRateLimit(`verify:${user.id}`, 3, 60 * 60_000)) {
    return { error: "rateLimited" };
  }

  return { ok: true, emailed: await sendVerificationEmail(user) };
}
