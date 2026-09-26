import { HeroField } from "@/components/landing/home/hero-field";
import { LandingMotion } from "@/components/landing/home/landing-motion";
import { Specimen } from "@/components/landing/home/specimen";
import { SplitHeading } from "@/components/landing/home/split-heading";
import { MarketingPage } from "@/components/landing/marketing-page";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PLANS } from "@/utils/plans";
import { PUBLIC_INSTRUMENTS } from "@/utils/public-instruments";
import { MIN_GROUP } from "@/utils/results";
import { siteUrl } from "@/utils/site";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

const FEATURES = [
  { key: "library", href: "/instruments" },
  { key: "rounds", href: "/product#rounds" },
  { key: "reports", href: "/product#reports" },
  { key: "analytics", href: "/product#analytics" },
] as const;
const TRUST = ["consent", "access", "judgement", "clinical", "retention"] as const;
const STEPS = ["pick", "send", "read"] as const;
// The shared library ships 19 instruments (prisma/seed-data/tests.json); the trial is 14 days.
const FACTS = [
  { key: "library", value: 19 },
  { key: "languages", value: 2 },
  { key: "group", value: MIN_GROUP },
  { key: "trial", value: 14 },
] as const;

// Runs during HTML parsing, before first paint: holds the hero's words for the intro so they
// don't flash. globals.css shows them anyway after a moment if the motion script never arrives.
const MOTION_HOLD = `if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.lpMotion="pending"`;

// The wide measure the landing is set on.
const WIDE = "mx-auto w-full max-w-[88rem] px-4 sm:px-8";

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
    <MarketingPage wide>
      <script dangerouslySetInnerHTML={{ __html: MOTION_HOLD }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />

      <LandingMotion>
        {/* Hero: the title on the left, a ridgeline of score distributions filling the right. */}
        <section className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden border-b border-foreground/80">
          <div data-hero-fade="top" className={`${WIDE} flex items-center justify-between gap-4 border-b py-3`}>
            <Eyebrow>{t("hero.eyebrow")}</Eyebrow>
            <Eyebrow className="hidden sm:inline">{t("hero.languages")}</Eyebrow>
          </div>

          <HeroField
            caption={t("hero.figure")}
            className="order-last h-[46svh] min-h-72 lg:absolute lg:inset-y-0 lg:right-0 lg:order-none lg:h-auto lg:w-[62%] lg:pt-12"
          />

          <div className={`${WIDE} relative z-10 flex flex-1 flex-col justify-between gap-12 pb-10 pt-12 sm:pt-14 lg:pb-8`}>
            <SplitHeading
              as="h1"
              intro
              text={t.raw("hero.title")}
              className="max-w-[11ch] text-[clamp(1.875rem,9.6vw,5.5rem)] lg:text-[clamp(4rem,6.6vw,7rem)] font-normal leading-[0.94] tracking-[-0.035em]"
            />
            <div className="flex max-w-xl flex-col gap-6">
              <p data-hero-fade="bottom" className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {t("hero.lead")}
              </p>
              <div data-hero-fade="bottom" className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/auth/sign-up">
                    {t("hero.cta")}
                    <ArrowRight className="ml-1 size-4" aria-hidden />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="bg-background/70">
                  <Link href="/pricing">{t("hero.secondary")}</Link>
                </Button>
              </div>
              <p data-hero-fade="bottom" className="text-sm text-muted-foreground">
                {t("hero.note")}
              </p>
            </div>
          </div>

          <p data-hero-fade="bottom" aria-hidden className={`${WIDE} relative z-10 hidden items-center gap-2 pb-6 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-muted-foreground lg:flex`}>
            <ArrowDown className="size-3.5 animate-bounce motion-reduce:animate-none" />
            {t("hero.scroll")}
          </p>
        </section>

        {/* Manifesto: one paragraph set large; its words darken as it scrolls past. */}
        <section className={`${WIDE} grid gap-6 py-24 sm:py-32 lg:grid-cols-[minmax(0,3fr)_minmax(0,9fr)]`}>
          <Eyebrow className="pt-3">{t("manifesto.label")}</Eyebrow>
          <p data-manifesto className="font-heading text-[clamp(1.75rem,3.6vw,3.5rem)] leading-[1.14] tracking-[-0.02em] text-pretty">
            {t("manifesto.text")
              .split(" ")
              .map((word, index) => (
                <span key={index}>{`${word} `}</span>
              ))}
          </p>
        </section>

        <div className="border-y border-foreground/80">
          <Specimen />
        </div>

        {/* Facts: four true numbers about the product, set as display numerals. */}
        <section aria-labelledby="facts-label" className={`${WIDE} py-24`}>
          <Eyebrow id="facts-label">{t("facts.label")}</Eyebrow>
          <dl className="mt-8 grid grid-cols-2 border-t border-foreground/80 lg:grid-cols-4">
            {FACTS.map((fact) => (
              <div key={fact.key} className="flex flex-col-reverse justify-end gap-3 border-b py-6 pr-6 even:pl-6 lg:border-b-0 lg:border-r lg:pl-6 lg:first:pl-0 lg:last:border-r-0">
                <dt className="max-w-[16rem] text-sm leading-relaxed text-muted-foreground">{t(`facts.${fact.key}`)}</dt>
                <dd data-count={fact.value} className="font-heading text-[clamp(4rem,9vw,8.5rem)] leading-[0.85] tracking-[-0.04em]" data-numeric>
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* How a round works: three panels that travel sideways on wide screens. */}
        <section data-track-section className="overflow-hidden border-t border-foreground/80 bg-card">
          <div className={`${WIDE} flex flex-col gap-12 py-20 lg:min-h-[calc(100svh-4rem)] lg:justify-center lg:py-16`}>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SplitHeading text={t("steps.title")} className="text-[clamp(2.25rem,5vw,4.75rem)] font-normal leading-none" />
              <Link href="/product" className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                {t("features.link")}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
            <ol data-track className="flex flex-col gap-6 lg:flex-row lg:gap-8">
              {STEPS.map((step, index) => (
                <li
                  key={step}
                  data-reveal={index * 0.1}
                  className="flex shrink-0 flex-col justify-between gap-16 rounded-lg border bg-background p-6 sm:p-10 lg:min-h-[52svh] lg:w-[min(46rem,58vw)]"
                >
                  <span className="font-heading text-[clamp(5rem,12vw,11rem)] leading-[0.8] tracking-[-0.05em] text-primary" data-numeric aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex max-w-md flex-col gap-3">
                    <h3 className="text-3xl font-medium sm:text-4xl">{t(`steps.${step}.title`)}</h3>
                    <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{t(`steps.${step}.text`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features as an index: numbered rows set large, each leading to its page. */}
        <section className={`${WIDE} py-24 sm:py-32`}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <SplitHeading text={t("features.title")} className="text-[clamp(2.25rem,5vw,4.75rem)] font-normal leading-none" />
            <p data-reveal className="max-w-xl self-end text-lg leading-relaxed text-muted-foreground">
              {t("features.lead")}
            </p>
          </div>
          <ul className="mt-14 border-t border-foreground/80">
            {FEATURES.map(({ key, href }, index) => (
              <li key={key} data-reveal className="border-b">
                <Link
                  href={href}
                  className="group grid gap-x-8 gap-y-3 py-8 transition-colors hover:bg-card focus-visible:bg-card sm:grid-cols-[3rem_minmax(0,5fr)_minmax(0,6fr)_2rem] sm:items-baseline sm:px-2"
                >
                  <span className="font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="text-[clamp(1.75rem,3vw,2.75rem)] font-normal leading-tight transition-transform duration-500 ease-[var(--ease-calm)] group-hover:translate-x-2">
                    {t(`features.${key}.title`)}
                  </h3>
                  <p className="max-w-xl leading-relaxed text-muted-foreground">{t(`features.${key}.text`)}</p>
                  <ArrowUpRight className="hidden size-5 text-muted-foreground transition-colors group-hover:text-primary sm:block" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Trust: the page turns to ink for the part about sensitive data. */}
        <section className="bg-foreground text-background">
          <div className={`${WIDE} grid gap-14 py-24 sm:py-32 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20`}>
            <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
              <SplitHeading text={t("trust.title")} className="text-[clamp(2.25rem,5vw,4.75rem)] font-normal leading-none" />
              <p data-reveal className="max-w-md text-lg leading-relaxed text-background/75">
                {t("trust.lead")}
              </p>
              <Link
                href="/security"
                className="group inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-inverse-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-background"
              >
                {t("trust.link")}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
            <ol className="flex flex-col border-t border-background/40">
              {TRUST.map((key, index) => (
                <li key={key} data-reveal className="grid grid-cols-[3rem_1fr] gap-x-4 border-b border-background/20 py-8">
                  <span className="pt-2 font-mono text-xs text-inverse-accent">{String(index + 1).padStart(2, "0")}</span>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-normal sm:text-3xl">{t(`trust.${key}.title`)}</h3>
                    <p className="max-w-lg leading-relaxed text-background/75">{t(`trust.${key}.text`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Library: instrument names set as a type specimen. */}
        <section className={`${WIDE} py-24 sm:py-32`}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <SplitHeading text={t("library.title")} className="text-[clamp(2.25rem,5vw,4.75rem)] font-normal leading-none" />
            <p data-reveal className="max-w-xl self-end text-lg leading-relaxed text-muted-foreground">
              {t("library.lead")}
            </p>
          </div>
          <ul className="mt-14 border-t border-foreground/80">
            {PUBLIC_INSTRUMENTS.map((instrument) => (
              <li key={instrument.slug} data-reveal className="border-b">
                <Link
                  href={`/instruments/${instrument.slug}`}
                  className="group flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8 sm:px-2"
                >
                  <span className="font-heading text-[clamp(1.75rem,4vw,3.5rem)] leading-tight tracking-[-0.02em] transition-[color,transform] duration-500 ease-[var(--ease-calm)] group-hover:translate-x-2 group-hover:text-primary">
                    {instruments(`items.${instrument.slug}.name`)}
                  </span>
                  <span className="flex shrink-0 items-center gap-4 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
                    <span>{instruments(`kinds.${instrument.kind}`)}</span>
                    <span data-numeric>
                      {instrument.questions} · {instrument.minutes}′
                    </span>
                    <ArrowUpRight className="size-4 transition-colors group-hover:text-primary" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/instruments" className="group mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            {t("library.all")}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </section>

        {/* Plans: respondents per year, the one number each plan is priced on. */}
        <section className="border-t border-foreground/80">
          <div className={`${WIDE} py-24 sm:py-32`}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <SplitHeading text={t("plans.title")} className="text-[clamp(2.25rem,5vw,4.75rem)] font-normal leading-none" />
              <p data-reveal className="max-w-xl self-end text-lg leading-relaxed text-muted-foreground">
                {t("plans.lead")}
              </p>
            </div>
            <dl className="mt-14 grid grid-cols-2 border-t border-foreground/80 lg:grid-cols-4">
              {PLANS.map((plan) => (
                <div key={plan.id} data-reveal className="flex flex-col gap-3 border-b py-6 pr-6 even:pl-6 lg:border-b-0 lg:border-r lg:pl-6 lg:first:pl-0 lg:last:border-r-0">
                  <dt>
                    <Eyebrow>{pricing(`plans.${plan.id}.name`)}</Eyebrow>
                  </dt>
                  <dd className="font-heading text-[clamp(2.5rem,5vw,4.5rem)] leading-none tracking-[-0.03em]" data-numeric>
                    <span className="sr-only">{pricing("compare.respondents")}: </span>
                    {plan.respondentsPerYear === null ? "∞" : format.number(plan.respondentsPerYear)}
                  </dd>
                  <dd className="text-sm text-muted-foreground">
                    {plan.staffSeats === null ? pricing("unlimitedSeats") : pricing("seats", { count: plan.staffSeats })}
                  </dd>
                </div>
              ))}
            </dl>
            <Link href="/pricing" className="group mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              {t("plans.link")}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </section>

        {/* Closing call to action. */}
        <section className="border-t border-foreground/80">
          <div className={`${WIDE} flex flex-col gap-10 py-24 sm:py-36`}>
            <SplitHeading text={t.raw("closing.title")} className="max-w-[14ch] text-[clamp(2.75rem,8vw,8rem)] font-normal leading-[0.94] tracking-[-0.035em]" />
            <div data-reveal className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">{t("cta.text")}</p>
              <Button size="lg" asChild>
                <Link href="/auth/sign-up">
                  {t("cta.button")}
                  <ArrowRight className="ml-1 size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </LandingMotion>
    </MarketingPage>
  );
}
