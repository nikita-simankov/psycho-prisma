import { ReactQueryProvider, ThemeProvider } from "@/components/provider";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { JetBrains_Mono, Literata, Onest } from "next/font/google";
import { siteUrl } from "@/utils/site";
import "./globals.css";

// Interface, display and data faces; all three cover Cyrillic. Mapped to font-sans / font-heading / font-mono in globals.css.
const onest = Onest({ subsets: ["latin", "cyrillic"], variable: "--font-onest" });
const literata = Literata({ subsets: ["latin", "cyrillic"], variable: "--font-literata" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], variable: "--font-jetbrains-mono" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");

  const locale = await getLocale();

  return {
    metadataBase: siteUrl(),
    applicationName: t("appName"),
    title: { default: t("title"), template: `%s · ${t("appName")}` },
    description: t("description"),
    openGraph: {
      type: "website",
      siteName: t("appName"),
      title: t("title"),
      description: t("description"),
      locale: locale === "ru" ? "ru_RU" : "en_US",
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description") },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations("common");

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${onest.variable} ${literata.variable} ${jetbrainsMono.variable} font-sans`}>
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ReactQueryProvider>
            <ThemeProvider attribute="class" defaultTheme="light">
              {children}
              <Toaster />
            </ThemeProvider>
          </ReactQueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
