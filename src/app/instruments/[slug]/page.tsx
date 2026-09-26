import { MarketingIntro, MarketingPage } from "@/components/landing/marketing-page";
import { Button } from "@/components/ui/button";
import { findPublicInstrument, PUBLIC_INSTRUMENTS } from "@/utils/public-instruments";
import { siteUrl } from "@/utils/site";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type Properties = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PUBLIC_INSTRUMENTS.map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Properties) {
  const { slug } = await params;
  const instrument = findPublicInstrument(slug);
  if (!instrument) {
    return {};
  }
  const t = await getTranslations("instruments");
  return {
    title: t(`items.${slug}.name`),
    description: t(`items.${slug}.summary`),
    alternates: { canonical: `/instruments/${slug}` },
  };
}

export default async function InstrumentPage({ params }: Properties) {
  const { slug } = await params;
  const instrument = findPublicInstrument(slug);
  if (!instrument) {
    notFound();
  }
  const t = await getTranslations("instruments");
  const name = t(`items.${slug}.name`);

  const facts = [
    { label: t("kind"), value: t(`kinds.${instrument.kind}`) },
    { label: t("length"), value: t("questions", { count: instrument.questions }) },
    { label: t("time"), value: t("minutes", { count: instrument.minutes }) },
    { label: t("scoring"), value: t("scoringValue") },
    { label: t("languages"), value: t("languagesValue") },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description: t(`items.${slug}.summary`),
    url: new URL(`/instruments/${slug}`, siteUrl()).toString(),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t("title"), item: new URL("/instruments", siteUrl()).toString() },
        { "@type": "ListItem", position: 2, name },
      ],
    },
  };

  return (
    <MarketingPage>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <MarketingIntro
        eyebrow={
          <Link href="/instruments" className="inline-flex items-center gap-1.5 hover:text-foreground">
            <ArrowLeft className="size-3" aria-hidden />
            {t("all")}
          </Link>
        }
        title={name}
        lead={t(`items.${slug}.summary`)}
      />
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-10">
          <section className="flex flex-col gap-3 border-t border-foreground/80 pt-4">
            <h2 className="text-2xl font-medium">{t("measures")}</h2>
            <p className="max-w-2xl leading-relaxed">{t(`items.${slug}.measures`)}</p>
          </section>
          <section className="flex flex-col gap-3 border-t border-foreground/80 pt-4">
            <h2 className="text-2xl font-medium">{t("use")}</h2>
            <p className="max-w-2xl leading-relaxed">{t(`items.${slug}.use`)}</p>
          </section>
          <p className="max-w-2xl border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground">{t("itemsNote")}</p>
        </div>
        <aside className="flex flex-col gap-8">
          <section className="border-t border-foreground/80 pt-4">
            <h2 className="text-xl font-medium">{t("format")}</h2>
            <dl className="mt-3">
              {facts.map((fact) => (
                <div key={fact.label} className="grid grid-cols-[7rem_1fr] gap-3 border-b py-2.5 text-sm">
                  <dt className="text-muted-foreground">{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="flex flex-col gap-3 rounded-lg border bg-card p-5">
            <h2 className="text-xl font-medium">{t("cta.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("cta.text")}</p>
            <Button asChild className="w-fit">
              <Link href="/auth/sign-up">
                {t("cta.button")}
                <ArrowRight className="ml-1 size-4" aria-hidden />
              </Link>
            </Button>
          </section>
        </aside>
      </div>
    </MarketingPage>
  );
}
