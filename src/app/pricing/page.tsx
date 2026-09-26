import { MarketingIntro, MarketingPage, MarketingSection } from "@/components/landing/marketing-page";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PLAN_CURRENCY, PLAN_FEATURES, PLANS, TRIAL_PLAN, type FeatureLevel, type Plan } from "@/utils/plans";
import { siteUrl } from "@/utils/site";
import { cn } from "@/utils/utils";
import { Check, Minus } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

const FAQ = ["respondent", "limit", "trial", "billing", "cancel", "privacy"] as const;

export async function generateMetadata() {
  const t = await getTranslations("pricing");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "/pricing" } };
}

export default async function PricingPage() {
  const t = await getTranslations("pricing");
  const format = await getFormatter();

  const price = (plan: Plan) =>
    plan.monthlyPrice === null
      ? t("custom")
      : plan.monthlyPrice === 0
        ? t("free")
        : format.number(plan.monthlyPrice, { style: "currency", currency: PLAN_CURRENCY, maximumFractionDigits: 0 });
  const respondents = (plan: Plan) =>
    plan.respondentsPerYear === null ? t("unlimitedRespondents") : t("respondents", { count: format.number(plan.respondentsPerYear) });
  const seats = (plan: Plan) => (plan.staffSeats === null ? t("unlimitedSeats") : t("seats", { count: plan.staffSeats }));
  const href = (plan: Plan) => (plan.id === "enterprise" ? "mailto:sales@calibre.example" : "/auth/sign-up");

  const level = (value: FeatureLevel) => {
    if (value === true) {
      return (
        <>
          <Check className="mx-auto size-4 text-success" aria-hidden />
          <span className="sr-only">{t("compare.included")}</span>
        </>
      );
    }
    if (value === false) {
      return (
        <>
          <Minus className="mx-auto size-4 text-muted-foreground" aria-hidden />
          <span className="sr-only">{t("compare.notIncluded")}</span>
        </>
      );
    }
    return t(`levels.${value}`);
  };

  // Plans as offers, and the questions below, for search engines.
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Calibre",
      url: new URL("/pricing", siteUrl()).toString(),
      offers: PLANS.filter((plan) => plan.monthlyPrice !== null).map((plan) => ({
        "@type": "Offer",
        name: t(`plans.${plan.id}.name`),
        price: plan.monthlyPrice,
        priceCurrency: PLAN_CURRENCY,
        description: respondents(plan),
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((key) => ({
        "@type": "Question",
        name: t(`faq.items.${key}.q`),
        acceptedAnswer: { "@type": "Answer", text: t(`faq.items.${key}.a`) },
      })),
    },
  ];

  return (
    <MarketingPage>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <MarketingIntro eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />

      <div className="mx-auto w-full max-w-6xl px-4">
        <ul className="grid border-y border-foreground/80 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const highlighted = plan.id === TRIAL_PLAN;
            return (
              <li
                key={plan.id}
                className={cn(
                  "flex flex-col gap-5 border-b p-5 last:border-b-0 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:last:border-r-0",
                  highlighted && "bg-accent/60 shadow-[inset_0_3px_0_var(--primary)]",
                )}
              >
                <div className="flex flex-col gap-2">
                  <Eyebrow className={cn(highlighted && "text-accent-foreground")}>
                    {highlighted ? `${t(`plans.${plan.id}.name`)} · ${t("trialBadge")}` : t(`plans.${plan.id}.name`)}
                  </Eyebrow>
                  <h2 className="sr-only">{t(`plans.${plan.id}.name`)}</h2>
                  <p className="font-heading text-4xl font-medium" data-numeric>
                    {price(plan)}
                  </p>
                  <p className="min-h-5 text-xs text-muted-foreground">{plan.monthlyPrice ? t("perMonth") : ""}</p>
                  <p className="text-sm">{t(`plans.${plan.id}.tagline`)}</p>
                </div>
                <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  <li>{respondents(plan)}</li>
                  <li>{seats(plan)}</li>
                </ul>
                <Button asChild variant={highlighted ? "default" : "outline"} className="mt-auto">
                  <Link href={href(plan)}>{t(`plans.${plan.id}.cta`)}</Link>
                </Button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">{t("note")}</p>
      </div>

      <MarketingSection title={t("compare.title")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b">
                <th scope="col" className="py-3 pr-4 text-left font-mono text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  {t("compare.feature")}
                </th>
                {PLANS.map((plan) => (
                  <th key={plan.id} scope="col" className="w-[15%] px-2 py-3 text-center font-medium">
                    {t(`plans.${plan.id}.name`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <th scope="row" className="py-3 pr-4 text-left font-normal">
                  {t("compare.respondents")}
                </th>
                {PLANS.map((plan) => (
                  <td key={plan.id} className="px-2 py-3 text-center" data-numeric>
                    {plan.respondentsPerYear === null ? t("compare.unlimited") : format.number(plan.respondentsPerYear)}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <th scope="row" className="py-3 pr-4 text-left font-normal">
                  {t("compare.seats")}
                </th>
                {PLANS.map((plan) => (
                  <td key={plan.id} className="px-2 py-3 text-center" data-numeric>
                    {plan.staffSeats === null ? t("compare.unlimited") : plan.staffSeats}
                  </td>
                ))}
              </tr>
              {PLAN_FEATURES.map((feature) => (
                <tr key={feature.key} className="border-b">
                  <th scope="row" className="py-3 pr-4 text-left font-normal">
                    {t(`features.${feature.key}`)}
                  </th>
                  {PLANS.map((plan) => (
                    <td key={plan.id} className="px-2 py-3 text-center">
                      {level(feature.levels[plan.id])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MarketingSection>

      <MarketingSection title={t("faq.title")}>
        <dl className="grid gap-x-10 md:grid-cols-2">
          {FAQ.map((key) => (
            <div key={key} className="flex flex-col gap-1.5 border-b py-5">
              <dt className="font-medium">{t(`faq.items.${key}.q`)}</dt>
              <dd className="text-sm leading-relaxed text-muted-foreground">
                {t(`faq.items.${key}.a`)}
                {key === "cancel" && (
                  <>
                    {" "}
                    <Link href="/legal/refunds" className="text-primary underline underline-offset-2">
                      {t("faq.refunds")}
                    </Link>
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </MarketingSection>
    </MarketingPage>
  );
}
