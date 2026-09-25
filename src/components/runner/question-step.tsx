"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

type Properties = {
  header: React.ReactNode;
  title: React.ReactNode;
  // Changes whenever a new question or page is shown; focus moves to its heading.
  stepKey: string | number;
  children: React.ReactNode;
  canContinue: boolean;
  onNext: () => void;
  onBack?: () => void;
  hint?: React.ReactNode;
};

// A question or a page of statements: header, heading, answers, and Back/Next.
export function QuestionStep({ header, title, stepKey, children, canContinue, onNext, onBack, hint }: Properties) {
  const common = useTranslations("common");
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  // Screen readers and keyboards start at the new question rather than wherever focus was left.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [stepKey]);

  return (
    <div className="flex w-full flex-col gap-6">
      {header}

      <h2 ref={heading} tabIndex={-1} className="font-heading text-xl font-semibold leading-snug outline-none sm:text-2xl">
        {title}
      </h2>

      <div className="flex flex-col gap-2">{children}</div>

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <div className="flex gap-2">
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
        {hint && <p className="hidden text-center text-xs text-muted-foreground sm:block">{hint}</p>}
      </div>
    </div>
  );
}
