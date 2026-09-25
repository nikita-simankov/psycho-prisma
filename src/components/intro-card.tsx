import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ChevronLeft, Clock, HelpCircle, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

// Start screen shown before a questionnaire or test.
export function IntroCard({
  name,
  description,
  instruction,
  questionCount,
  minutes,
  startHref,
  backHref,
}: {
  name: string;
  description: string;
  instruction?: string;
  questionCount: number;
  minutes: number;
  startHref: string;
  backHref: string;
}) {
  const t = useTranslations("respondent");
  const common = useTranslations("common");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:py-10">
      <Link href={backHref} className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
        {t("home")}
      </Link>
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{name}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4" />
            {t("questionCount", { count: questionCount })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {common("minutes", { count: minutes })}
          </span>
        </div>
      </div>
      {(description || instruction) && (
        <Card className="flex flex-col gap-4 p-5">
          {description && (
            <section className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("about")}</h2>
              <p className="whitespace-pre-line leading-relaxed">{description.trim()}</p>
            </section>
          )}
          {instruction && (
            <section className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("instruction")}</h2>
              <p className="whitespace-pre-line leading-relaxed">{instruction.trim()}</p>
            </section>
          )}
        </Card>
      )}
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        {t("privacyNote")}
      </p>
      <Button size="lg" asChild className="w-full sm:w-fit">
        <Link href={startHref}>
          {t("start")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
