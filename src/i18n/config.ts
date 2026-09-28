export const LOCALES = ["en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? "");
}

// The language an email to someone is written in: theirs, else the server's MAIL_LOCALE, else English.
export function mailLocale(locale: string): Locale {
  return isLocale(locale) ? locale : isLocale(process.env.MAIL_LOCALE) ? process.env.MAIL_LOCALE : DEFAULT_LOCALE;
}
