import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ArrowRight, ChevronLeft, Lock } from "lucide-react";
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
  answered = 0,
  journey,
  promise,
}: {
  name: string;
  description: string;
  instruction?: string;
  questionCount: number;
  minutes: number;
  startHref: string;
  backHref: string;
  // Questions already answered in a saved draft.
  answered?: number;
  // Where this sits in a round, "Onboarding check · 2 of 3".
  journey?: { round: string; position: number; total: number } | null;
  // What happens to the answers; replaces the short privacy note.
  promise?: React.ReactNode;
}) {
  const t = useTranslations("respondent");
  const common = useTranslations("common");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-14">
      <Link href={backHref} className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" />
        {t("home")}
      </Link>
      <header className="flex flex-col gap-3">
        {journey && journey.position > 0 && journey.total > 1 && (
          <p className="text-sm text-muted-foreground">{t("journey", { round: journey.round, position: journey.position, total: journey.total })}</p>
        )}
        <Eyebrow>
          {t("questionCount", { count: questionCount })} · {common("minutes", { count: minutes })}
        </Eyebrow>
        <h1 className="text-4xl font-medium leading-[1.1] sm:text-5xl">{name}</h1>
      </header>
      {description && (
        <section className="flex flex-col gap-2 border-t border-foreground/80 pt-4">
          <h2 className="font-sans">
            <Eyebrow>{t("about")}</Eyebrow>
          </h2>
          <p className="whitespace-pre-line text-lg leading-relaxed">{description.trim()}</p>
        </section>
      )}
      {instruction && (
        <section className="flex flex-col gap-2 border-t pt-4">
          <h2 className="font-sans">
            <Eyebrow>{t("instruction")}</Eyebrow>
          </h2>
          <p className="whitespace-pre-line leading-relaxed">{instruction.trim()}</p>
        </section>
      )}
      {promise ?? (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t("privacyNote")}
        </p>
      )}
      {answered > 0 && (
        <p role="status" className="border-l-2 border-primary bg-card py-3 pl-4 pr-3 text-sm">
          {t("resumeNote", { answered, total: questionCount })}
        </p>
      )}
      <Button size="lg" asChild className="w-full sm:w-fit">
        <Link href={startHref}>
          {answered > 0 ? t("continue") : t("start")}
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
