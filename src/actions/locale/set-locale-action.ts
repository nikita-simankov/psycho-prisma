"use server";

import { isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { cookies } from "next/headers";

export async function setLocale(locale: string) {
  if (!isLocale(locale)) {
    throw new Error("Unsupported locale");
  }

  cookies().set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
