"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

type Properties = {
  position: number;
  total: number;
  title: string;
  children: React.ReactNode;
  canContinue: boolean;
  onNext: () => void;
  onBack?: () => void;
};

// One question at a time: progress, the question, its answers, and Back/Next.
export function QuestionStep({ position, total, title, children, canContinue, onNext, onBack }: Properties) {
  const t = useTranslations("runner");
  const common = useTranslations("common");

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("progress", { current: position, total })}</span>
          <span className="tabular-nums">{Math.round(((position - 1) / total) * 100)}%</span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={position - 1}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((position - 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="font-heading text-xl font-semibold leading-snug sm:text-2xl">{title}</h2>

      <div className="flex flex-col gap-2">{children}</div>

      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        {onBack && (
          <Button variant="outline" size="lg" onClick={onBack} className="px-4">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-2">{common("back")}</span>
          </Button>
        )}
        <Button size="lg" className="flex-1" disabled={!canContinue} onClick={onNext}>
          {common("next")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
