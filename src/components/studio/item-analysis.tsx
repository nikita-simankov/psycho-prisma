import type { TestQuestion } from "@/utils/constants";
import { MIN_ITEM_SAMPLE, type ScaleAnalysis } from "@/utils/psychometrics";
import { cn } from "@/utils/utils";
import { ChevronRight, Info } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

// Rules of thumb from classical test theory: items nearly everyone (or no one) scores tell people
// apart poorly, items that barely correlate with the rest of their scale may measure something
// else, and a scale's alpha below 0.7 is too noisy for decisions about individuals.
const EXTREME = { low: 0.1, high: 0.9 };
const WEAK_DISCRIMINATION = 0.2;
const ALPHA = { good: 0.8, acceptable: 0.7 };

const two = (value: number | null) => (value === null ? "—" : value.toFixed(2));

// Item statistics for the studio: per scale, Cronbach's alpha and each item's difficulty and
// corrected item-total correlation, from the responses to the published version.
export function ItemAnalysis({
  analysis,
  responses,
  version,
  questions,
}: {
  analysis: ScaleAnalysis[] | null;
  responses: number;
  version: number;
  questions: Pick<TestQuestion, "id" | "text">[];
}) {
  const t = useTranslations("studio.psychometrics");
  const format = useFormatter();
  const number = new Map(questions.map((question, index) => [question.id, { index: index + 1, text: question.text }]));

  return (
    <section className="flex flex-col gap-4 border-t border-foreground/80 pt-5" aria-labelledby="item-analysis" data-item-analysis>
      <header className="flex flex-col gap-1">
        <h2 id="item-analysis" className="text-xl font-medium">
          {t("title")}
        </h2>
        <p className="max-w-[68ch] text-sm text-muted-foreground">{t("description", { count: responses, version })}</p>
      </header>

      {!analysis ? (
        <p className="flex max-w-[68ch] items-start gap-2 rounded-lg border bg-card p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t("tooFew", { count: responses, min: MIN_ITEM_SAMPLE })}
        </p>
      ) : (
        <>
          <div className="flex flex-col divide-y rounded-lg border bg-card">
            {analysis.map((scale) => {
              const verdict = scale.alpha === null ? null : scale.alpha >= ALPHA.good ? "good" : scale.alpha >= ALPHA.acceptable ? "acceptable" : "low";
              return (
                <details key={scale.scaleId} className="group">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 sm:px-4">
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
                    <span className="font-medium">{scale.scaleName || "—"}</span>
                    <span className="text-xs text-muted-foreground">{t("items", { count: scale.items.length })}</span>
                    <span className="ml-auto flex items-baseline gap-2 text-sm">
                      <span className="font-mono tabular-nums">α {two(scale.alpha)}</span>
                      {verdict && (
                        <span className={cn("text-xs", verdict === "low" ? "font-medium text-warning" : "text-muted-foreground")}>{t(`alpha.${verdict}`)}</span>
                      )}
                    </span>
                  </summary>
                  {scale.items.length > 0 && (
                    <div className="overflow-x-auto border-t">
                      <table className="w-full text-sm">
                        <thead className="text-left font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground">
                          <tr className="border-b">
                            <th className="py-1.5 pl-3 pr-2 font-medium sm:pl-4">{t("question")}</th>
                            <th className="w-28 py-1.5 pr-2 text-right font-medium">{t("difficulty")}</th>
                            <th className="w-32 py-1.5 pr-3 text-right font-medium sm:pr-4">{t("discrimination")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scale.items.map((item) => {
                            const question = number.get(item.questionId);
                            const extreme = item.difficulty !== null && (item.difficulty < EXTREME.low || item.difficulty > EXTREME.high);
                            const weak = item.discrimination === null || item.discrimination < WEAK_DISCRIMINATION;
                            return (
                              <tr key={item.questionId} className="border-b align-top last:border-0">
                                <td className="py-1.5 pl-3 pr-2 sm:pl-4">
                                  <span className="mr-1.5 tabular-nums text-muted-foreground">{question?.index ?? "?"}.</span>
                                  <span className="line-clamp-2">{question?.text || "—"}</span>
                                </td>
                                <td className={cn("py-1.5 pr-2 text-right font-mono tabular-nums", extreme && "font-semibold text-warning")}>
                                  {item.difficulty === null ? "—" : format.number(item.difficulty, { style: "percent" })}
                                </td>
                                <td className={cn("py-1.5 pr-3 text-right font-mono tabular-nums sm:pr-4", weak && "font-semibold text-warning")}>
                                  {two(item.discrimination)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </details>
              );
            })}
          </div>
          <p className="max-w-[68ch] text-xs text-muted-foreground">{t("legend", { weak: WEAK_DISCRIMINATION })}</p>
        </>
      )}
    </section>
  );
}
