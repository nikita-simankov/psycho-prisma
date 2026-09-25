import { PrivacyNotice } from "@/components/privacy-notice";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("privacy");
  return { title: t("metaTitle"), description: t("lead") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-16">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="mb-8 mt-3 text-lg text-muted-foreground">{t("lead")}</p>
        <PrivacyNotice />
      </main>
      <SiteFooter />
    </div>
  );
}
