import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/utils/utils";
import { getTranslations } from "next-intl/server";
import { SplitHeading } from "./split-heading";

const SCALES = [
  { key: "a", value: 8, team: 6 },
  { key: "b", value: 6, team: 6 },
  { key: "c", value: 3, team: 5 },
  { key: "d", value: 5, team: 4 },
] as const;
const NOTES = ["scored", "context", "judgement"] as const;
const STENS = Array.from({ length: 10 }, (_, index) => index + 1);

// The landing's report specimen: the product's sten profile, drawn large. The markup is the final
// state; on wide screens the landing's motion pins it and sweeps each score to its sten.
export async function Specimen() {
  const t = await getTranslations("landing");

  return (
    <section data-specimen className="mx-auto grid w-full max-w-[88rem] gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:py-16">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-5">
          <Eyebrow>{t("specimen.label")}</Eyebrow>
          <SplitHeading text={t("specimen.title")} className="text-[clamp(2rem,4vw,3.75rem)] font-normal leading-[1.02]" />
        </div>
        <ol className="flex flex-col border-t border-foreground/80">
          {NOTES.map((note, index) => (
            <li key={note} data-note className="specimen-note grid grid-cols-[2.5rem_1fr] gap-x-2 border-b py-5">
              <span className="pt-1 font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-medium">{t(`specimen.notes.${note}.title`)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{t(`specimen.notes.${note}.text`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <figure data-reveal className="flex flex-col gap-4 self-center">
        <div className="flex flex-col gap-8 rounded-lg border bg-card p-6 sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-6">
            <div className="flex flex-col gap-2">
              <Eyebrow>{t("figure.label")}</Eyebrow>
              <p className="font-heading text-3xl font-medium sm:text-4xl">{t("figure.person")}</p>
              <p className="text-sm text-muted-foreground">{t("figure.role")}</p>
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.1em]">{t("figure.test")}</p>
          </div>
          <div className="flex flex-col gap-5">
            <div aria-hidden className="grid grid-cols-[minmax(0,9rem)_1fr_2.5rem] items-center gap-4 sm:grid-cols-[minmax(0,13rem)_1fr_2.5rem]">
              <span />
              <div className="grid grid-cols-10 gap-1 text-center font-mono text-[0.625rem] text-muted-foreground">
                {STENS.map((step) => (
                  <span key={step}>{step}</span>
                ))}
              </div>
              <span />
            </div>
            {SCALES.map((scale) => {
              const label = t(`figure.scales.${scale.key}`);
              return (
                <div key={scale.key} className="grid grid-cols-[minmax(0,9rem)_1fr_2.5rem] items-center gap-4 text-sm sm:grid-cols-[minmax(0,13rem)_1fr_2.5rem] sm:text-base">
                  <span className="truncate">{label}</span>
                  <div data-scale={scale.value} role="img" aria-label={`${label}: ${t("figure.sten", { value: scale.value })}`} className="grid grid-cols-10 gap-1">
                    {STENS.map((step) => (
                      <span
                        key={step}
                        data-cell={step}
                        data-on={step === scale.value || undefined}
                        className={cn(
                          "specimen-cell h-6 border sm:h-7",
                          step >= 4 && step <= 7 ? "border-primary/15 bg-accent" : "bg-muted",
                          step === scale.team && "shadow-[inset_0_-4px_0_var(--series-2)]",
                        )}
                      />
                    ))}
                  </div>
                  <span data-readout className="text-right font-mono text-lg" data-numeric>
                    {scale.value}
                  </span>
                </div>
              );
            })}
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.6875rem] text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 bg-primary" aria-hidden />
              {t("figure.person_legend")}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 border border-primary/15 bg-accent" aria-hidden />
              {t("figure.band_legend")}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 shadow-[inset_0_-3px_0_var(--series-2)]" aria-hidden />
              {t("figure.team_legend")}
            </li>
          </ul>
          <p className="border-l-2 border-primary/40 pl-4 font-heading text-base italic text-muted-foreground">{t("figure.note")}</p>
        </div>
        <figcaption className="font-mono text-[0.6875rem] text-muted-foreground">{t("figure.caption")}</figcaption>
      </figure>
    </section>
  );
}
