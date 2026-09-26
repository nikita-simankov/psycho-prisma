import { MarketingIntro, MarketingPage, MarketingSection } from "@/components/landing/marketing-page";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

const SECTIONS = ["rounds", "respondents", "reports", "analytics", "studio", "privacy"] as const;

export async function generateMetadata() {
  const t = await getTranslations("product");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "/product" } };
}

export default async function ProductPage() {
  const t = await getTranslations("product");
  const site = await getTranslations("site");
  const landing = await getTranslations("landing");

  return (
    <MarketingPage>
      <MarketingIntro eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
        <nav aria-labelledby="product-contents" className="mt-4 flex flex-col gap-3">
          <Eyebrow id="product-contents">{t("contents")}</Eyebrow>
          <ol className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {SECTIONS.map((key, index) => (
              <li key={key}>
                <a href={`#${key}`} className="hover:text-primary">
                  <span className="mr-1.5 font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  {t(`sections.${key}.title`)}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </MarketingIntro>

      {SECTIONS.map((key, index) => (
        <MarketingSection
          key={key}
          id={key}
          number={String(index + 1).padStart(2, "0")}
          title={t(`sections.${key}.title`)}
          lead={t(`sections.${key}.lead`)}
        >
          <ul className="grid gap-x-8 md:ml-[4.5rem] md:grid-cols-3">
            {(t.raw(`sections.${key}.points`) as string[]).map((point) => (
              <li key={point} className="border-t py-4 text-sm leading-relaxed">
                {point}
              </li>
            ))}
          </ul>
        </MarketingSection>
      ))}

      <section className="mx-auto w-full max-w-6xl px-4 pt-20">
        <div className="flex flex-col items-start gap-6 border-y border-foreground/80 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex max-w-xl flex-col gap-2">
            <h2 className="text-3xl font-medium">{landing("cta.title")}</h2>
            <p className="text-muted-foreground">{landing("cta.text")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                {site("trial")}
                <ArrowRight className="ml-1 size-4" aria-hidden />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">{site("nav.pricing")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
