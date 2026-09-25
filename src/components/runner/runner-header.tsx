"use client";

import { Button } from "@/components/ui/button";
import { Check, CloudOff, Loader2, Pause } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SaveStatus } from "./use-draft";

// Progress, time left and save state above every question or page.
export function RunnerHeader({
  label,
  answered,
  total,
  minutesLeft,
  status,
  onPause,
}: {
  label: string;
  answered: number;
  total: number;
  minutesLeft: number;
  status: SaveStatus;
  onPause: () => void;
}) {
  const t = useTranslations("runner");
  const percent = total ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{label}</span>
        <Button variant="ghost" size="sm" className="-mr-2 h-8 shrink-0 gap-1 px-2" onClick={onPause}>
          <Pause className="h-3.5 w-3.5" />
          {t("pause")}
        </Button>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={t("answeredOf", { answered, total })}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answered}
      >
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
      <div className="flex min-h-4 items-center justify-between gap-2 text-xs text-muted-foreground">
        <p className="flex items-center gap-1" aria-live="polite">
          {status === "saving" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> {t("saving")}
            </>
          )}
          {status === "saved" && (
            <>
              <Check className="h-3 w-3" aria-hidden /> {t("saved")}
            </>
          )}
          {status === "error" && (
            <span className="flex items-center gap-1 text-destructive">
              <CloudOff className="h-3 w-3" aria-hidden /> {t("notSaved")}
            </span>
          )}
        </p>
        <span className="tabular-nums">{minutesLeft > 0 ? t("minutesLeft", { count: minutesLeft }) : t("almostDone")}</span>
      </div>
    </div>
  );
}

// Minutes left from the pace so far, or the instrument's estimate before there is any.
export function estimateMinutesLeft(
  remaining: number,
  total: number,
  estimateMinutes: number,
  timings: Record<string, number>
) {
  const spent = Object.values(timings);
  const perQuestion =
    spent.length >= 3
      ? spent.reduce((sum, ms) => sum + Math.min(ms, 120_000), 0) / spent.length / 60_000
      : estimateMinutes / Math.max(total, 1);
  return Math.ceil(remaining * perQuestion);
}
