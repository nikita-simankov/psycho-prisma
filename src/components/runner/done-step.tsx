"use client";

import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ArrowLeft, Check, Loader2, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

type Properties = {
  text: string;
  pending: boolean;
  onFinish: () => void;
  onBack: () => void;
};

export function DoneStep({ text, pending, onFinish, onBack }: Properties) {
  const t = useTranslations("runner");
  const common = useTranslations("common");
  const respondent = useTranslations("respondent");

  return (
    <div className="flex w-full flex-col gap-5 border-t border-foreground/80 pt-6">
      <Eyebrow className="flex items-center gap-1.5 text-success">
        <Check className="size-3.5" aria-hidden />
        {t("allAnswered")}
      </Eyebrow>
      <h2 className="font-heading text-3xl font-normal leading-tight">{t("doneTitle")}</h2>
      <p className="max-w-md text-muted-foreground">{text}</p>
      <p className="flex max-w-md items-start gap-2 text-sm text-muted-foreground">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {respondent("privacyNote")}
      </p>
      <div className="mt-3 flex w-full max-w-sm gap-2">
        <Button variant="outline" size="lg" onClick={onBack} disabled={pending}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">{common("back")}</span>
        </Button>
        <Button size="lg" className="flex-1" disabled={pending} onClick={onFinish}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {common("finish")}
        </Button>
      </div>
    </div>
  );
}
