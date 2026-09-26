import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, Locale, LOCALE_COOKIE, LOCALES } from "./config";

// Locale comes from the language switcher's cookie, then the browser's Accept-Language.
async function resolveLocale(): Promise<Locale> {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;

  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }

  const accepted = (await headers()).get("accept-language") ?? "";

  for (const part of accepted.split(",")) {
    const language = part.split(";")[0].trim().slice(0, 2).toLowerCase();

    if (isLocale(language)) {
      return language;
    }
  }

  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

export { LOCALES };
