"use server";

import { emailSchema } from "@/app/auth/sign-up/schema/sign-up.schema";
import { prisma } from "@/utils/database";
import { consumeRateLimit } from "@/utils/rate-limit";
import { resendOpenLinks } from "@/utils/rounds";
import { headers } from "next/headers";
import { after } from "next/server";

// From the expired-link page: emails fresh links for the person's open rounds. The answer is the
// same whether or not the address has anything open, so it can't be used to look people up.
export async function requestNewRoundLink(email: unknown): Promise<{ ok: true } | { error: "invalidEmail" | "rateLimited" }> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { error: "invalidEmail" };
  }
  const address = parsed.data.toLowerCase();
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!consumeRateLimit(`round-link:ip:${ip}`, 10, 60 * 60_000) || !consumeRateLimit(`round-link:email:${address}`, 3, 60 * 60_000)) {
    return { error: "rateLimited" };
  }

  // After the response, so how long it takes doesn't tell whether anything was sent.
  after(async () => {
    const user = await prisma.user.findFirst({ where: { email: { equals: address, mode: "insensitive" } }, select: { id: true } });
    if (user) {
      await resendOpenLinks(user.id);
    }
  });
  return { ok: true };
}
