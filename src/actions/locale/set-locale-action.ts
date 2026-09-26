"use server";

import { isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { getCurrentUser } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { cookies } from "next/headers";

export async function setLocale(locale: string) {
  if (!isLocale(locale)) {
    throw new Error("Unsupported locale");
  }

  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  // Remembered on the account so scheduled emails go out in this language.
  const user = await getCurrentUser();
  if (user) {
    await prisma.user.update({ where: { id: user.id }, data: { locale } });
  }
}
