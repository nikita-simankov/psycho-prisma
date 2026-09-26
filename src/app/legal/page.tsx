import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { WithPlaceholders } from "@/components/landing/legal-document";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function generateMetadata() {
  const t = await getTranslations("legal.index");
  return { title: t("metaTitle"), description: t("lead"), alternates: { canonical: "/legal" } };
}

const DOCUMENTS = [
  { key: "terms", href: "/legal/terms" },
  { key: "dpa", href: "/legal/dpa" },
  { key: "subprocessors", href: "/legal/subprocessors" },
  { key: "refunds", href: "/legal/refunds" },
  { key: "privacy", href: "/privacy" },
  { key: "security", href: "/security" },
] as const;

export default async function LegalIndexPage() {
  const t = await getTranslations("legal.index");
  const common = await getTranslations("legal.common");

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-16">
        <header className="flex flex-col gap-4 pb-10">
          <Eyebrow>{common("eyebrow")}</Eyebrow>
          <h1 className="text-4xl font-medium leading-[1.1] sm:text-5xl">{t("title")}</h1>
          <p className="text-lg text-muted-foreground">{t("lead")}</p>
        </header>
        <ul className="flex flex-col">
          {DOCUMENTS.map((document) => (
            <li key={document.key} className="border-t border-foreground/80 py-5">
              <h2 className="text-xl font-medium">
                <Link href={document.href} className="underline-offset-4 hover:text-primary hover:underline">
                  {t(`documents.${document.key}.title`)}
                </Link>
              </h2>
              <p className="mt-1 text-muted-foreground">{t(`documents.${document.key}.summary`)}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 border-t border-border pt-5 text-sm text-muted-foreground">
          <WithPlaceholders text={t("contact")} />
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
