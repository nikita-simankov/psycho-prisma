"use client";

import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Eyebrow>{label}</Eyebrow>
        <div className="flex items-center gap-3">
          <p className="flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-muted-foreground" aria-live="polite">
            {status === "saving" && (
              <>
                <Loader2 className="size-3 animate-spin" aria-hidden /> {t("saving")}
              </>
            )}
            {status === "saved" && (
              <>
                <Check className="size-3 text-success" aria-hidden /> {t("saved")}
              </>
            )}
            {status === "error" && (
              <span className="flex items-center gap-1.5 text-destructive">
                <CloudOff className="size-3" aria-hidden /> {t("notSaved")}
              </span>
            )}
          </p>
          <Button variant="ghost" size="sm" className="-mr-2 gap-1.5 px-2 text-muted-foreground" onClick={onPause}>
            <Pause className="size-3.5" />
            {t("pause")}
          </Button>
        </div>
      </div>
      <div
        className="h-0.5 w-full bg-border"
        role="progressbar"
        aria-label={t("answeredOf", { answered, total })}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answered}
      >
        <div className="h-full bg-foreground transition-[width] duration-500 ease-calm" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-right font-mono text-xs tabular-nums text-muted-foreground">
        {minutesLeft > 0 ? t("minutesLeft", { count: minutesLeft }) : t("almostDone")}
      </p>
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
