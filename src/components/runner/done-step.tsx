"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
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

  return (
    <div className="flex w-full flex-col items-center gap-4 py-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCircle2 className="h-7 w-7" />
      </span>
      <h2 className="font-heading text-2xl font-semibold">{t("doneTitle")}</h2>
      <p className="max-w-md text-muted-foreground">{text}</p>
      <div className="mt-2 flex w-full max-w-sm gap-2">
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
