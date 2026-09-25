import { TimeMetricsChart } from "@/components/landing/time-metrics-chart";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

const FEATURES = ["library", "scoring", "reports", "groups"] as const;
const STEPS = ["import", "invite", "review"] as const;

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const common = await getTranslations("common");

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="h-16 w-full border-b flex items-center px-4">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
          <Logo withText />
          <nav className="flex flex-row items-center gap-2">
            <LocaleSwitcher />
            <Button size="sm" variant="ghost" asChild>
              <Link href="/auth/sign-in">{common("signIn")}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/sign-up">{common("signUp")}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="px-4 py-24 w-full">
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            <h1 className="text-4xl md:text-6xl font-black max-w-3xl">
              {t("hero.title")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {t("hero.subtitle")}
            </p>
            <div>
              <Button size="lg" asChild>
                <Link href="/auth/sign-up" className="flex items-center gap-2">
                  {t("hero.cta")}
                  <ChevronRight className="w-[1.2rem] h-[1.2rem]" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 w-full bg-muted/40">
          <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-2 items-center">
            <div className="flex flex-col gap-6">
              <h2 className="text-3xl font-bold tracking-tight">
                {t("features.title")}
              </h2>
              <ul className="grid gap-6">
                {FEATURES.map((feature) => (
                  <li key={feature} className="grid gap-1">
                    <h3 className="text-xl font-bold">
                      {t(`features.${feature}.title`)}
                    </h3>
                    <p className="text-muted-foreground">
                      {t(`features.${feature}.text`)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <TimeMetricsChart />
          </div>
        </section>

        <section className="px-4 py-16 w-full">
          <div className="max-w-6xl mx-auto flex flex-col gap-8">
            <h2 className="text-3xl font-bold tracking-tight">
              {t("steps.title")}
            </h2>
            <ol className="grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step} className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-primary">
                    {t("steps.label", { number: index + 1 })}
                  </span>
                  <h3 className="text-xl font-bold">
                    {t(`steps.${step}.title`)}
                  </h3>
                  <p className="text-muted-foreground">
                    {t(`steps.${step}.text`)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t px-4 py-8 text-sm text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-2">
          <span>{t("footer.tagline")}</span>
          <span>{t("footer.disclaimer")}</span>
        </div>
      </footer>
    </div>
  );
}
