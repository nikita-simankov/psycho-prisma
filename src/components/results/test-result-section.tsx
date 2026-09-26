import { ValidityPanel } from "@/components/validity-panel";
import type { TestResult } from "@/utils/results";
import type { ScaleRow } from "@/utils/scoring";
import { cn } from "@/utils/utils";
import { ChevronRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { QualityWarnings } from "./quality-warnings";
import { ScaleProfile } from "./scale-profile";

function Finding({ row, muted }: { row: ScaleRow; muted?: boolean }) {
  return (
    <div className="break-inside-avoid border-l-2 border-primary/40 pl-3">
      <dt className={cn("font-medium", muted && "text-muted-foreground")}>{row.scaleName}</dt>
      {row.summary && <dd className="whitespace-pre-line text-sm text-muted-foreground">{row.summary}</dd>}
    </div>
  );
}

// One test in a report: how far the answers can be trusted, then what stands out, then the profile.
export function TestResultSection({
  result,
  subtitle,
  showAnswers = true,
}: {
  result: TestResult;
  subtitle?: string;
  showAnswers?: boolean;
}) {
  const t = useTranslations("report");
  const table = useTranslations("results.table");
  const format = useFormatter();
  const choiceByQuestion = new Map(result.responses.map((response) => [response.questionId, response.choiceId]));
  const findings = [...result.keyFindings, ...result.otherFindings];

  return (
    <section id={`result-${result.id}`} aria-labelledby={`result-${result.id}-title`} className="flex scroll-mt-20 flex-col gap-4 rounded-xl border bg-card p-4 sm:p-6 print:break-before-page print:border-0 print:p-0">
      <header className="flex flex-col gap-0.5">
        <h2 id={`result-${result.id}-title`} className="text-lg font-semibold leading-snug sm:text-xl">
          {result.testName}
        </h2>
        <p className="text-sm text-muted-foreground">
          {format.dateTime(result.createdAt, { dateStyle: "medium" })}
          {subtitle && ` · ${subtitle}`}
        </p>
      </header>

      {result.validity && <ValidityPanel validity={result.validity} />}
      <QualityWarnings warnings={result.warnings} />

      {findings.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {result.keyFindings.length ? t("keyFindings") : t("findings")}
          </h3>
          {result.keyFindings.length === 0 && result.rows.some((row) => row.stan !== null || row.tGrade !== null) && (
            <p className="text-sm text-muted-foreground">{t("allAverage")}</p>
          )}
          <dl className="flex flex-col gap-3">
            {(result.keyFindings.length ? result.keyFindings : result.otherFindings).map((row) => (
              <Finding key={row.scaleId} row={row} />
            ))}
          </dl>
          {result.keyFindings.length > 0 && result.otherFindings.length > 0 && (
            <details className="group" data-print-open>
              <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-primary print:hidden">
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden />
                {t("otherScales", { count: result.otherFindings.length })}
              </summary>
              <dl className="mt-3 flex flex-col gap-3">
                {result.otherFindings.map((row) => (
                  <Finding key={row.scaleId} row={row} muted />
                ))}
              </dl>
            </details>
          )}
        </div>
      )}

      {result.rows.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("profile")}</h3>
          <ScaleProfile rows={result.rows} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("notScored")}</p>
      )}

      {showAnswers && (
        <details className="group print:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-primary">
            <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden />
            {t("answers", { count: result.responses.length })}
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="w-12 py-1.5 pr-2 font-medium">{table("number")}</th>
                  <th className="py-1.5 pr-2 font-medium">{table("question")}</th>
                  <th className="py-1.5 font-medium">{table("answer")}</th>
                </tr>
              </thead>
              <tbody>
                {result.questions.map((question, index) => {
                  const choiceId = choiceByQuestion.get(question.id);
                  return (
                    <tr key={question.id} className="border-b last:border-0 align-top">
                      <td className="py-1.5 pr-2 tabular-nums text-muted-foreground">{index + 1}</td>
                      <td className="py-1.5 pr-2">{question.text}</td>
                      <td className="py-1.5">{question.choices.find((choice) => choice.id === choiceId)?.text ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
