import { HeroField } from "@/components/landing/home/hero-field";
import { HeroTitle } from "@/components/landing/home/hero-title";
import { DistributionFigure, Marquee, RollLabel, ScrambleLabel } from "@/components/landing/home/kinetic";
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
import { ArrowRight, ArrowUpRight } from "lucide-react";
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
const SECTION_TITLE = "text-[clamp(2rem,6vw,5.5rem)] font-normal leading-[0.96] tracking-[-0.035em]";

function TextLink({ href, children, className }: { href: string; children: string; className?: string }) {
  return (
    <Link href={href} className={`group inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary ${className ?? ""}`}>
      <RollLabel>{children}</RollLabel>
      <ArrowRight className="size-3.5 transition-transform duration-500 ease-[var(--ease-calm)] group-hover:translate-x-1" aria-hidden />
    </Link>
  );
}

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
        {/* Hero: the title over a ridgeline of score distributions. The field sits beside the text on
            wide screens and between the title and the lead on phones, and moves on both. */}
        <section data-hero className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden border-b border-foreground/80">
          <div data-hero-fade="top" className={`${WIDE} flex items-center justify-between gap-4 border-b py-3`}>
            <Eyebrow className="inline-flex items-center gap-2">
              <span className="relative flex size-1.5" aria-hidden>
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/60 motion-reduce:animate-none" />
                <span className="relative size-1.5 rounded-full bg-primary" />
              </span>
              {t("hero.eyebrow")}
            </Eyebrow>
            <Eyebrow className="hidden sm:inline">{t("hero.languages")}</Eyebrow>
          </div>

          <div className={`${WIDE} grid flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:grid-rows-[minmax(0,1fr)_auto] lg:gap-x-10`}>
            <div data-hero-parallax className="pt-10 sm:pt-14 lg:col-start-1 lg:row-start-1 lg:self-center lg:pb-10 lg:pt-10">
              <HeroTitle
                text={t.raw("hero.title")}
                alternates={t.raw("hero.rotate")}
                className="max-w-[12ch] text-[clamp(1.625rem,8.8vw,5.5rem)] font-normal leading-[0.94] tracking-[-0.04em] lg:text-[clamp(4rem,6.4vw,7.25rem)]"
              />
            </div>

            <HeroField
              caption={t("hero.figure")}
              hint={t("hero.hint")}
              className="-mx-4 min-h-[36svh] sm:-mx-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:-mr-8 lg:-ml-[18%] lg:min-h-0 lg:py-8"
            />

            <div className="flex max-w-xl flex-col gap-6 pb-10 pt-6 lg:col-start-1 lg:row-start-2 lg:pb-14 lg:pt-0">
              <p data-hero-fade="bottom" className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {t("hero.lead")}
              </p>
              <div data-hero-fade="bottom" className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="group">
                  <Link href="/auth/sign-up">
                    <RollLabel>{t("hero.cta")}</RollLabel>
                    <ArrowRight className="ml-1 size-4 transition-transform duration-500 ease-[var(--ease-calm)] group-hover:translate-x-1" aria-hidden />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="group bg-background/80">
                  <Link href="/pricing">
                    <RollLabel>{t("hero.secondary")}</RollLabel>
                  </Link>
                </Button>
              </div>
              <p data-hero-fade="bottom" className="text-sm text-muted-foreground">
                {t("hero.note")}
              </p>
            </div>
          </div>

          <div data-hero-fade="bottom" aria-hidden className={`${WIDE} hidden items-center justify-between gap-6 pb-5 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-muted-foreground lg:flex`}>
            <span className="flex items-center gap-3">
              <span className="lp-scroll-cue relative h-8 w-px overflow-hidden bg-foreground/15" />
              {t("hero.scroll")}
            </span>
            <span>{t("hero.hint")}</span>
          </div>
        </section>

        {/* Manifesto: one paragraph set large; its words light up as it scrolls through. */}
        <section className={`${WIDE} grid gap-8 py-24 sm:py-36 lg:grid-cols-[minmax(0,3fr)_minmax(0,9fr)]`}>
          <div className="pt-3">
            <ScrambleLabel>{t("manifesto.label")}</ScrambleLabel>
          </div>
          <p data-manifesto className="font-heading text-[clamp(1.75rem,4vw,3.75rem)] leading-[1.12] tracking-[-0.02em] text-pretty">
            {t("manifesto.text")
              .split(" ")
              .map((word, index) => (
                <span key={index}>{`${word} `}</span>
              ))}
          </p>
        </section>

        {/* A band of the product's own words, drifting with the scroll. */}
        <div className="border-y border-foreground/80">
          <Marquee
            rows={[
              { words: PUBLIC_INSTRUMENTS.map((instrument) => instruments(`items.${instrument.slug}.name`)) },
              { words: TRUST.map((key) => t(`trust.${key}.title`)), italic: true, reverse: true },
            ]}
          />
        </div>

        <Specimen />

        {/* Facts: four true numbers about the product, set as display numerals. */}
        <section aria-labelledby="facts-label" className={`${WIDE} py-24 sm:py-32`}>
          <ScrambleLabel id="facts-label">{t("facts.label")}</ScrambleLabel>
          <dl className="relative mt-8 grid grid-cols-2 lg:grid-cols-4">
            <span data-rule aria-hidden className="absolute inset-x-0 top-0 h-px origin-left bg-foreground/80" />
            {FACTS.map((fact) => (
              <div key={fact.key} className="flex flex-col-reverse justify-end gap-3 border-b py-6 pr-6 even:pl-6 lg:border-b-0 lg:border-r lg:pl-6 lg:first:pl-0 lg:last:border-r-0">
                <dt className="max-w-[16rem] text-sm leading-relaxed text-muted-foreground">{t(`facts.${fact.key}`)}</dt>
                <dd data-count={fact.value} className="font-heading text-[clamp(4.5rem,11vw,9.5rem)] leading-[0.85] tracking-[-0.05em]" data-numeric>
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* How a round works: panels that travel sideways on wide screens and stack up like cards on
            phones. overflow-x-clip rather than hidden, so the cards can stick. */}
        <section data-track-section className="overflow-x-clip border-t border-foreground/80 bg-card">
          <div className={`${WIDE} flex flex-col gap-12 py-20 lg:min-h-[calc(100svh-4rem)] lg:justify-center lg:py-16`}>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex flex-col gap-5">
                <ScrambleLabel>{t("steps.label")}</ScrambleLabel>
                <SplitHeading text={t("steps.title")} className={SECTION_TITLE} />
              </div>
              <TextLink href="/product">{t("features.link")}</TextLink>
            </div>
            <ol data-track className="flex flex-col gap-4 lg:flex-row lg:gap-8">
              {STEPS.map((step, index) => (
                <li
                  key={step}
                  data-step
                  style={{ top: `calc(5rem + ${index * 1.25}rem)` }}
                  className="sticky flex min-h-[22rem] shrink-0 origin-top flex-col justify-between gap-12 rounded-lg border bg-background p-6 shadow-[0_-12px_32px_-24px_rgb(0_0_0/0.35)] sm:p-10 lg:static lg:min-h-[52svh] lg:w-[min(46rem,58vw)] lg:shadow-none"
                >
                  <div className="flex items-start justify-between gap-6">
                    <span className="font-heading text-[clamp(5rem,14vw,11rem)] leading-[0.8] tracking-[-0.05em] text-primary" data-numeric aria-hidden>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground" aria-hidden>
                      {index + 1} / {STEPS.length}
                    </span>
                  </div>
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
        <section className={`${WIDE} border-t border-foreground/80 py-24 sm:py-32`}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="flex flex-col gap-5">
              <ScrambleLabel>{t("features.label")}</ScrambleLabel>
              <SplitHeading text={t("features.title")} className={SECTION_TITLE} />
            </div>
            <p data-reveal className="max-w-xl self-end text-lg leading-relaxed text-muted-foreground">
              {t("features.lead")}
            </p>
          </div>
          <ul className="mt-14">
            {FEATURES.map(({ key, href }, index) => (
              <li key={key} data-reveal className="relative">
                <span data-rule aria-hidden className={`absolute inset-x-0 top-0 h-px origin-left ${index === 0 ? "bg-foreground/80" : "bg-border"}`} />
                <Link
                  href={href}
                  className="lp-row group relative grid gap-x-8 gap-y-3 py-8 sm:grid-cols-[3rem_minmax(0,5fr)_minmax(0,6fr)_2rem] sm:items-baseline sm:px-3"
                >
                  <span className="font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="text-[clamp(1.75rem,3.2vw,3rem)] font-normal leading-tight tracking-[-0.02em] transition-transform duration-500 ease-[var(--ease-calm)] group-hover:translate-x-2">
                    {t(`features.${key}.title`)}
                  </h3>
                  <p className="max-w-xl leading-relaxed text-muted-foreground">{t(`features.${key}.text`)}</p>
                  <ArrowUpRight className="hidden size-5 text-muted-foreground transition-[color,transform] duration-500 ease-[var(--ease-calm)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary sm:block" aria-hidden />
                </Link>
              </li>
            ))}
            <li aria-hidden className="h-px bg-border" />
          </ul>
        </section>

        {/* Trust: the page turns to ink for the part about sensitive data. */}
        <section className="bg-foreground text-background">
          <div className={`${WIDE} grid gap-14 py-24 sm:py-32 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20`}>
            <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
              <Eyebrow className="inline-flex items-center gap-2 text-background/70">
                <span className="size-1.5 rounded-full bg-inverse-accent" aria-hidden />
                {t("trust.label")}
              </Eyebrow>
              <SplitHeading text={t("trust.title")} className={SECTION_TITLE} />
              <p data-reveal className="max-w-md text-lg leading-relaxed text-background/75">
                {t("trust.lead")}
              </p>
              <Link
                href="/security"
                className="group inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-inverse-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-background"
              >
                <RollLabel>{t("trust.link")}</RollLabel>
                <ArrowRight className="size-3.5 transition-transform duration-500 ease-[var(--ease-calm)] group-hover:translate-x-1" aria-hidden />
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
            <div className="flex flex-col gap-5">
              <ScrambleLabel>{t("library.label")}</ScrambleLabel>
              <SplitHeading text={t("library.title")} className={SECTION_TITLE} />
            </div>
            <p data-reveal className="max-w-xl self-end text-lg leading-relaxed text-muted-foreground">
              {t("library.lead")}
            </p>
          </div>
          <ul className="mt-14">
            {PUBLIC_INSTRUMENTS.map((instrument, index) => (
              <li key={instrument.slug} data-reveal className="relative">
                <span data-rule aria-hidden className={`absolute inset-x-0 top-0 h-px origin-left ${index === 0 ? "bg-foreground/80" : "bg-border"}`} />
                <Link
                  href={`/instruments/${instrument.slug}`}
                  className="lp-row group relative flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8 sm:px-3"
                >
                  <span className="font-heading text-[clamp(1.75rem,4vw,3.5rem)] leading-tight tracking-[-0.02em] transition-[color,transform] duration-500 ease-[var(--ease-calm)] group-hover:translate-x-2 group-hover:text-primary">
                    {instruments(`items.${instrument.slug}.name`)}
                  </span>
                  <span className="flex shrink-0 items-center gap-4 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
                    <span>{instruments(`kinds.${instrument.kind}`)}</span>
                    <span data-numeric>
                      {instrument.questions} · {instrument.minutes}′
                    </span>
                    <ArrowUpRight className="size-4 transition-[color,transform] duration-500 ease-[var(--ease-calm)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
            <li aria-hidden className="h-px bg-border" />
          </ul>
          <TextLink href="/instruments" className="mt-8">
            {t("library.all")}
          </TextLink>
        </section>

        {/* Plans: respondents per year, the one number each plan is priced on. */}
        <section className="border-t border-foreground/80">
          <div className={`${WIDE} py-24 sm:py-32`}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div className="flex flex-col gap-5">
                <ScrambleLabel>{t("plans.label")}</ScrambleLabel>
                <SplitHeading text={t("plans.title")} className={SECTION_TITLE} />
              </div>
              <p data-reveal className="max-w-xl self-end text-lg leading-relaxed text-muted-foreground">
                {t("plans.lead")}
              </p>
            </div>
            <dl className="relative mt-14 grid grid-cols-2 lg:grid-cols-4">
              <span data-rule aria-hidden className="absolute inset-x-0 top-0 h-px origin-left bg-foreground/80" />
              {PLANS.map((plan, index) => (
                <div
                  key={plan.id}
                  data-reveal={index * 0.08}
                  className="flex flex-col gap-3 border-b py-6 pr-6 even:pl-6 lg:border-b-0 lg:border-r lg:pl-6 lg:first:pl-0 lg:last:border-r-0"
                >
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
            <TextLink href="/pricing" className="mt-8">
              {t("plans.link")}
            </TextLink>
          </div>
        </section>

        {/* Closing: the page ends where the hero's field does, on one person read against a team. */}
        <section className="border-t border-foreground/80">
          <div className={`${WIDE} flex flex-col gap-12 py-24 sm:py-36`}>
            <ScrambleLabel>{t("closing.kicker")}</ScrambleLabel>
            <SplitHeading chars text={t.raw("closing.title")} className="max-w-[14ch] text-[clamp(3rem,10vw,9.5rem)] font-normal leading-[0.92] tracking-[-0.045em]" />
            <DistributionFigure caption={t("closing.figure")} />
            <div data-reveal className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">{t("cta.text")}</p>
              <Button size="lg" asChild className="group">
                <Link href="/auth/sign-up">
                  <RollLabel>{t("cta.button")}</RollLabel>
                  <ArrowRight className="ml-1 size-4 transition-transform duration-500 ease-[var(--ease-calm)] group-hover:translate-x-1" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </LandingMotion>
    </MarketingPage>
  );
}
