import { ResultPreview } from "@/components/landing/result-preview";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Check,
  ClipboardCheck,
  EyeOff,
  FileText,
  Scale,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { siteUrl } from "@/utils/site";

const FEATURES = [
  { key: "library", icon: BookOpen },
  { key: "scoring", icon: Calculator },
  { key: "reports", icon: FileText },
  { key: "groups", icon: Users },
] as const;
const TRUST = [
  { key: "consent", icon: ClipboardCheck },
  { key: "access", icon: EyeOff },
  { key: "judgement", icon: Scale },
] as const;
const STEPS = ["import", "invite", "review"] as const;
const TRUST_POINTS = ["private", "languages", "mobile"] as const;

export const metadata = { alternates: { canonical: "/" } };

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const meta = await getTranslations("metadata");
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
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <SiteHeader />

      <main id="main" className="flex flex-1 flex-col">
        <section className="relative overflow-hidden px-4 py-16 sm:py-24">
          <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-linear-to-b from-accent/70 to-transparent" />
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
            <div className="flex flex-col gap-6">
              <span className="w-fit rounded-full border bg-card px-3 py-1 text-sm font-medium text-accent-foreground">
                {t("hero.eyebrow")}
              </span>
              <h1 className="text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">{t("hero.title")}</h1>
              <p className="max-w-xl text-lg text-muted-foreground">{t("hero.subtitle")}</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/auth/sign-up">
                    {t("hero.cta")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/sign-in">{t("hero.secondary")}</Link>
                </Button>
              </div>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {TRUST_POINTS.map((point) => (
                  <li key={point} className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-success" />
                    {t(`hero.trust.${point}`)}
                  </li>
                ))}
              </ul>
            </div>
            <ResultPreview />
          </div>
        </section>

        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto flex max-w-6xl flex-col gap-10">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold sm:text-4xl">{t("features.title")}</h2>
              <p className="mt-3 text-lg text-muted-foreground">{t("features.subtitle")}</p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ key, icon: Icon }) => (
                <li key={key} className="flex flex-col gap-3 rounded-2xl border bg-card p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-semibold">{t(`features.${key}.title`)}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{t(`features.${key}.text`)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-foreground px-4 py-16 text-background sm:py-20 dark:bg-card dark:text-foreground">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">{t("trust.title")}</h2>
              <p className="mt-3 text-lg opacity-70">{t("trust.subtitle")}</p>
            </div>
            <ul className="grid gap-6 sm:grid-cols-3">
              {TRUST.map(({ key, icon: Icon }) => (
                <li key={key} className="flex flex-col gap-3">
                  <Icon className="h-6 w-6 text-primary dark:text-primary" />
                  <h3 className="text-lg font-semibold">{t(`trust.${key}.title`)}</h3>
                  <p className="text-sm leading-relaxed opacity-70">{t(`trust.${key}.text`)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto flex max-w-6xl flex-col gap-10">
            <h2 className="text-3xl font-bold sm:text-4xl">{t("steps.title")}</h2>
            <ol className="grid gap-8 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step} className="flex flex-col gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary font-heading font-bold text-primary">
                    {index + 1}
                  </span>
                  <h3 className="text-xl font-semibold">{t(`steps.${step}.title`)}</h3>
                  <p className="text-muted-foreground">{t(`steps.${step}.text`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-12 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold sm:text-3xl">{t("cta.title")}</h2>
              <p className="mt-2 opacity-85">{t("cta.text")}</p>
            </div>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/sign-up">
                {t("cta.button")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
