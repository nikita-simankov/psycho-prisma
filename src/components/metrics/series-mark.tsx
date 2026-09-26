import { cn } from "@/utils/utils";

export const SERIES = ["person", "team", "everyone"] as const;
export type Series = (typeof SERIES)[number];

// Each series has its own colour and shape, so identity never rests on colour alone.
const SHAPE: Record<Series, string> = {
  person: "rounded-full bg-series-1",
  team: "rotate-45 rounded-[2px] bg-series-2",
  everyone: "rounded-[2px] bg-series-3",
};

export function SeriesMark({ series, className }: { series: Series; className?: string }) {
  return <span aria-hidden className={cn("inline-block h-2.5 w-2.5 shrink-0", SHAPE[series], className)} />;
}

export function seriesShape(series: Series) {
  return SHAPE[series];
}
