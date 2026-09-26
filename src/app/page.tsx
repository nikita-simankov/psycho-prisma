import { MarketingPage, MarketingSection } from "@/components/landing/marketing-page";
import { ProfileFigure } from "@/components/landing/profile-figure";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PLANS } from "@/utils/plans";
import { PUBLIC_INSTRUMENTS } from "@/utils/public-instruments";
import { siteUrl } from "@/utils/site";
import { ArrowRight } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

const FEATURES = ["library", "rounds", "reports", "analytics"] as const;
const TRUST = ["consent", "access", "clinical", "retention"] as const;
const STEPS = ["pick", "send", "read"] as const;

export const metadata = { alternates: { canonical: "/" } };

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const meta = await getTranslations("metadata");
  const pricing = await getTranslations("pricing");
  const instruments = await getTranslations("instruments");
  const format = await getFormatter();
  // Describes the product to search engines.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: meta("appName"),
    description: meta("description"),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteUrl().toString(),
    inLanguage: ["en", "ru"],
    offers: { "@type": "Offer", price: 0, priceCurrency: "EUR" },
  };

  return (
    <MarketingPage>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />

      <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pb-8 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col gap-6">
          <Eyebrow>{t("hero.eyebrow")}</Eyebrow>
          <h1 className="text-4xl font-medium leading-[1.06] sm:text-5xl lg:text-6xl">{t("hero.title")}</h1>
          <p className="max-w-xl text-lg text-muted-foreground">{t("hero.lead")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                {t("hero.cta")}
                <ArrowRight className="ml-1 size-4" aria-hidden />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">{t("hero.secondary")}</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{t("hero.note")}</p>
        </div>
        <ProfileFigure />
      </section>

      <MarketingSection number="01" title={t("features.title")} lead={t("features.lead")}>
        <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((key) => (
            <li key={key} className="flex flex-col gap-2 border-t pt-4">
              <h3 className="text-lg font-medium">{t(`features.${key}.title`)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(`features.${key}.text`)}</p>
            </li>
          ))}
        </ul>
        <Link href="/product" className="mt-8 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {t("features.link")}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </MarketingSection>

      <MarketingSection number="02" title={t("trust.title")} lead={t("trust.lead")}>
        <ol className="grid gap-x-8 sm:grid-cols-2">
          {TRUST.map((key, index) => (
            <li key={key} className="grid grid-cols-[2.5rem_1fr] gap-x-2 border-b py-5">
              <span className="pt-1 font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-medium">{t(`trust.${key}.title`)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{t(`trust.${key}.text`)}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link href="/security" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {t("trust.link")}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </MarketingSection>

      <MarketingSection number="03" title={t("steps.title")}>
        <ol className="grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step} className="flex flex-col gap-2">
              <span className="font-heading text-4xl font-medium text-primary" data-numeric>
                {index + 1}
              </span>
              <h3 className="text-lg font-medium">{t(`steps.${step}.title`)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(`steps.${step}.text`)}</p>
            </li>
          ))}
        </ol>
      </MarketingSection>

      <MarketingSection number="04" title={t("library.title")} lead={t("library.lead")}>
        <ul className="grid border-t sm:grid-cols-2 lg:grid-cols-3">
          {PUBLIC_INSTRUMENTS.map((instrument) => (
            <li key={instrument.slug} className="border-b sm:odd:border-r lg:border-r lg:[&:nth-child(3n)]:border-r-0">
              <Link href={`/instruments/${instrument.slug}`} className="group flex h-full flex-col gap-2 p-4 hover:bg-card">
                <Eyebrow>{instruments(`kinds.${instrument.kind}`)}</Eyebrow>
                <span className="font-heading text-lg font-medium group-hover:text-primary">
                  {instruments(`items.${instrument.slug}.name`)}
                </span>
                <span className="text-sm text-muted-foreground">{instruments(`items.${instrument.slug}.summary`)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/instruments" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {t("library.all")}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </MarketingSection>

      <MarketingSection number="05" title={t("plans.title")} lead={t("plans.lead")}>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-6 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div key={plan.id} className="flex flex-col gap-2 border-t pt-4">
              <dt>
                <Eyebrow>{pricing(`plans.${plan.id}.name`)}</Eyebrow>
              </dt>
              <dd className="font-heading text-3xl font-medium" data-numeric>
                <span className="sr-only">{pricing("compare.respondents")}: </span>
                {plan.respondentsPerYear === null ? "∞" : format.number(plan.respondentsPerYear)}
              </dd>
              <dd className="text-sm text-muted-foreground">
                {plan.staffSeats === null ? pricing("unlimitedSeats") : pricing("seats", { count: plan.staffSeats })}
              </dd>
            </div>
          ))}
        </dl>
        <Link href="/pricing" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {t("plans.link")}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </MarketingSection>

      <section className="mx-auto w-full max-w-6xl px-4 pt-20">
        <div className="flex flex-col items-start gap-6 border-y border-foreground/80 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex max-w-xl flex-col gap-2">
            <h2 className="text-3xl font-medium">{t("cta.title")}</h2>
            <p className="text-muted-foreground">{t("cta.text")}</p>
          </div>
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">
              {t("cta.button")}
              <ArrowRight className="ml-1 size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </MarketingPage>
  );
}
