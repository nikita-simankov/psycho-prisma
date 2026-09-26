"use client";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { TestScale } from "@/utils/constants";
import { hasFormula, nextId, STRATEGIES, type TestContent } from "@/utils/instrument-content";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = { content: TestContent; onChange: (content: TestContent) => void };

function numberOr(value: string, fallback = 0) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

// How answers become scores: the strategy, then each scale with the points every answer gives it.
export function ScoringEditor({ content, onChange }: Props) {
  const t = useTranslations("studio.scoring");
  const setScale = (id: number, scale: TestScale) => onChange({ ...content, scales: content.scales.map((entry) => (entry.id === id ? scale : entry)) });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex max-w-md flex-col gap-1.5">
        <Label htmlFor="strategy">{t("strategy")}</Label>
        <Select value={content.strategy} onValueChange={(strategy) => onChange({ ...content, strategy: strategy as TestContent["strategy"] })}>
          <SelectTrigger id="strategy">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STRATEGIES.map((strategy) => (
              <SelectItem key={strategy} value={strategy}>
                {t(`strategies.${strategy}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t(`strategyHints.${content.strategy}`)}</p>
      </div>

      {content.scales.map((scale, index) => {
        const points = (questionId: number, choiceId: number) =>
          scale.keys.find((key) => key.questionId === questionId && key.choiceId === choiceId)?.grade ?? 0;
        const setPoints = (questionId: number, choiceId: number, grade: number) =>
          setScale(scale.id, {
            ...scale,
            keys: [
              ...scale.keys.filter((key) => !(key.questionId === questionId && key.choiceId === choiceId)),
              ...(grade !== 0 ? [{ questionId, choiceId, grade }] : []),
            ],
          });
        const keyed = new Set(scale.keys.map((key) => key.questionId)).size;

        return (
          <Collapsible key={scale.id} defaultOpen={content.scales.length === 1} className="rounded-lg border bg-card">
            <div className="flex flex-wrap items-end gap-3 p-3 sm:p-4">
              <div className="flex min-w-48 flex-1 flex-col gap-1.5">
                <Label htmlFor={`scale-${scale.id}`}>{t("scaleName", { number: index + 1 })}</Label>
                <Input id={`scale-${scale.id}`} value={scale.name} onChange={(event) => setScale(scale.id, { ...scale, name: event.target.value })} />
              </div>
              <div className="flex w-48 flex-col gap-1.5">
                <Label htmlFor={`formula-${scale.id}`}>{t("formula")}</Label>
                <Input
                  id={`formula-${scale.id}`}
                  value={hasFormula(scale) ? scale.resultCalculationFormula : ""}
                  placeholder={t("formulaPlaceholder")}
                  onChange={(event) => setScale(scale.id, { ...scale, resultCalculationFormula: event.target.value || "Нет" })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("removeScale", { name: scale.name || index + 1 })}
                onClick={() =>
                  onChange({
                    ...content,
                    scales: content.scales.filter((entry) => entry.id !== scale.id),
                    stanTable: content.stanTable.filter((row) => row.scaleId !== scale.id),
                    tGradeTable: content.tGradeTable.filter((row) => row.scaleId !== scale.id),
                    summaryTable: content.summaryTable.filter((row) => row.scaleId !== scale.id),
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="flex w-full flex-col gap-1.5">
                <Label htmlFor={`scale-description-${scale.id}`}>{t("scaleDescription")}</Label>
                <Input
                  id={`scale-description-${scale.id}`}
                  value={scale.description ?? ""}
                  maxLength={2000}
                  placeholder={t("scaleDescriptionPlaceholder")}
                  onChange={(event) => setScale(scale.id, { ...scale, description: event.target.value || undefined })}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t px-3 py-2.5 text-sm sm:px-4">
              <label className="flex items-center gap-2">
                <Switch
                  checked={Boolean(scale.validity)}
                  onCheckedChange={(checked) => setScale(scale.id, { ...scale, validity: checked ? { measure: "grade" } : undefined })}
                />
                {t("validity")}
              </label>
              {scale.validity && (
                <label className="flex items-center gap-2">
                  {t("validityMax")}
                  <Input
                    type="number"
                    className="h-8 w-24"
                    value={scale.validity.max ?? ""}
                    onChange={(event) =>
                      setScale(scale.id, { ...scale, validity: { ...scale.validity!, max: event.target.value === "" ? undefined : numberOr(event.target.value) } })
                    }
                  />
                </label>
              )}
              <label className="flex items-center gap-2" title={t("reliabilityHint")}>
                {t("reliability")}
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  max="0.99"
                  className="h-8 w-20 tabular-nums"
                  placeholder="0.80"
                  defaultValue={scale.reliability ?? ""}
                  onChange={(event) => {
                    const value = numberOr(event.target.value, NaN);
                    setScale(scale.id, { ...scale, reliability: value > 0 && value < 1 ? value : undefined });
                  }}
                />
              </label>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="-ml-3 sm:ml-auto">
                  {t("keys", { count: keyed, total: content.questions.length })}
                  <ChevronDown className="ml-1.5 h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="border-t">
              <p className="px-3 pt-3 text-xs text-muted-foreground sm:px-4">{t("keysHint")}</p>
              <ol className="flex flex-col divide-y">
                {content.questions.map((question, questionIndex) => (
                  <li key={question.id} className="grid gap-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-4">
                    <span className="text-sm">
                      <span className="mr-1.5 tabular-nums text-muted-foreground">{questionIndex + 1}.</span>
                      {question.text || "—"}
                    </span>
                    <span className="flex flex-wrap gap-2">
                      {question.choices.map((choice) => (
                        <label key={choice.id} className="flex items-center gap-1 text-xs text-muted-foreground" title={choice.text}>
                          <span className="max-w-24 truncate">{choice.text || "—"}</span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            className="h-8 w-16 text-right tabular-nums"
                            aria-label={t("pointsFor", { choice: choice.text, question: questionIndex + 1, scale: scale.name })}
                            value={points(question.id, choice.id) || ""}
                            placeholder="0"
                            onChange={(event) => setPoints(question.id, choice.id, numberOr(event.target.value))}
                          />
                        </label>
                      ))}
                    </span>
                  </li>
                ))}
              </ol>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        onClick={() =>
          onChange({
            ...content,
            scales: [...content.scales, { id: nextId(content.scales), name: "", keys: [], multiplier: 1, correction: 0, resultCalculationFormula: "Нет" }],
          })
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("addScale")}
      </Button>
    </div>
  );
}

// Raw score bands to stens, or raw scores to T-scores, per scale.
export function NormsEditor({ content, onChange }: Props) {
  const t = useTranslations("studio.norms");

  if (content.strategy === "grade") {
    return <p className="text-sm text-muted-foreground">{t("notNeeded")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t(content.strategy === "standard-ten" ? "stenHint" : "tHint")}</p>
      {content.scales.map((scale, index) => (
        <section key={scale.id} className="rounded-lg border bg-card p-3 sm:p-4">
          <h3 className="mb-3 text-sm font-semibold">{scale.name || t("scale", { number: index + 1 })}</h3>
          {content.strategy === "standard-ten" ? (
            <NumberRows
              headers={[t("from"), t("to"), t("sten")]}
              rows={content.stanTable.filter((row) => row.scaleId === scale.id).map((row) => [row.minGrade, row.maxGrade, row.stanValue])}
              onChange={(rows) =>
                onChange({
                  ...content,
                  stanTable: [
                    ...content.stanTable.filter((row) => row.scaleId !== scale.id),
                    ...rows.map(([minGrade, maxGrade, stanValue]) => ({ scaleId: scale.id, minGrade, maxGrade, stanValue })),
                  ],
                })
              }
              blank={(rows) => {
                const last = rows[rows.length - 1];
                return last ? [last[1] + 1, last[1] + 1, Math.min(10, last[2] + 1)] : [0, 0, 1];
              }}
            />
          ) : (
            <NumberRows
              headers={[t("raw"), t("tScore")]}
              rows={content.tGradeTable.filter((row) => row.scaleId === scale.id).map((row) => [row.rawGrade, row.convertedGrade])}
              onChange={(rows) =>
                onChange({
                  ...content,
                  tGradeTable: [
                    ...content.tGradeTable.filter((row) => row.scaleId !== scale.id),
                    ...rows.map(([rawGrade, convertedGrade]) => ({ scaleId: scale.id, rawGrade, convertedGrade })),
                  ],
                })
              }
              blank={(rows) => {
                const last = rows[rows.length - 1];
                return last ? [last[0] + 1, last[1]] : [0, 50];
              }}
            />
          )}
        </section>
      ))}
    </div>
  );
}

function NumberRows({
  headers,
  rows,
  onChange,
  blank,
}: {
  headers: string[];
  rows: number[][];
  onChange: (rows: number[][]) => void;
  blank: (rows: number[][]) => number[];
}) {
  const t = useTranslations("studio.norms");
  return (
    <div className="flex flex-col gap-2">
      {rows.length > 0 && (
        <table className="w-full max-w-md text-sm">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} className="pb-1 text-left text-xs font-medium text-muted-foreground">
                  {header}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((value, column) => (
                  <td key={column} className="py-0.5 pr-2">
                    <Input
                      type="number"
                      step="any"
                      className="h-8 tabular-nums"
                      aria-label={`${headers[column]} ${rowIndex + 1}`}
                      value={value}
                      onChange={(event) =>
                        onChange(rows.map((entry, i) => (i === rowIndex ? entry.map((cell, c) => (c === column ? numberOr(event.target.value, cell) : cell)) : entry)))
                      }
                    />
                  </td>
                ))}
                <td>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={t("removeRow", { number: rowIndex + 1 })} onClick={() => onChange(rows.filter((_, i) => i !== rowIndex))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => onChange([...rows, blank(rows)])}>
        <Plus className="mr-1.5 h-4 w-4" />
        {t("addRow")}
      </Button>
    </div>
  );
}

// What each score range means, shown in results and reports.
export function InterpretationsEditor({ content, onChange }: Props) {
  const t = useTranslations("studio.interpretations");
  const unit = content.strategy === "standard-ten" ? "stan" : content.strategy === "t-grade" ? "t" : "grade";
  const range = (row: TestContent["summaryTable"][number]) =>
    unit === "stan" ? [row.minStanValue, row.maxStanValue] : unit === "t" ? [row.minTGrade, row.maxTGrade] : [row.minGrade, row.maxGrade];
  const withRange = (row: TestContent["summaryTable"][number], min: number, max: number) =>
    unit === "stan" ? { ...row, minStanValue: min, maxStanValue: max } : unit === "t" ? { ...row, minTGrade: min, maxTGrade: max } : { ...row, minGrade: min, maxGrade: max };
  const set = (index: number, row: TestContent["summaryTable"][number]) => onChange({ ...content, summaryTable: content.summaryTable.map((entry, i) => (i === index ? row : entry)) });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{t(`hint.${unit}`)}</p>
      {content.summaryTable.map((row, index) => {
        const [min, max] = range(row);
        return (
          <section key={index} className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-[12rem_6rem_6rem_minmax(0,1fr)_auto] sm:items-start">
            <Select value={String(row.scaleId)} onValueChange={(value) => set(index, { ...row, scaleId: Number(value) })}>
              <SelectTrigger aria-label={t("scale")}>
                <SelectValue placeholder={t("scale")} />
              </SelectTrigger>
              <SelectContent>
                {content.scales.map((scale, scaleIndex) => (
                  <SelectItem key={scale.id} value={String(scale.id)}>
                    {scale.name || scaleIndex + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" step="any" aria-label={t("from")} placeholder={t("from")} value={min} onChange={(event) => set(index, withRange(row, numberOr(event.target.value), max))} />
            <Input type="number" step="any" aria-label={t("to")} placeholder={t("to")} value={max} onChange={(event) => set(index, withRange(row, min, numberOr(event.target.value)))} />
            <textarea
              className="min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              aria-label={t("text")}
              placeholder={t("textPlaceholder")}
              value={row.summaryText}
              onChange={(event) => set(index, { ...row, summaryText: event.target.value })}
            />
            <Button type="button" variant="ghost" size="icon" aria-label={t("remove", { number: index + 1 })} onClick={() => onChange({ ...content, summaryTable: content.summaryTable.filter((_, i) => i !== index) })}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </section>
        );
      })}
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        disabled={content.scales.length === 0}
        onClick={() =>
          onChange({
            ...content,
            summaryTable: [
              ...content.summaryTable,
              { scaleId: content.scales[0].id, strategy: content.strategy, minGrade: 0, maxGrade: 0, minTGrade: 0, maxTGrade: 0, minStanValue: 0, maxStanValue: 0, summaryText: "" },
            ],
          })
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("add")}
      </Button>
    </div>
  );
}
