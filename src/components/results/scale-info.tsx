import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Band, NormScale } from "@/utils/norms";
import type { ScaleInfo } from "@/utils/results";
import { CircleHelp } from "lucide-react";
import { useTranslations } from "next-intl";

const RANGES: Record<NormScale, Record<Band, string>> = {
  sten: { low: "1–3", average: "4–7", high: "8–10" },
  t: { low: "< 40", average: "40–60", high: "> 60" },
};

// "What does this mean?" beside a scale: what it measures and how to read a low, average or high
// score, in the test's own words where it has them.
export function ScaleInfoButton({ name, info, kind }: { name: string; info?: ScaleInfo; kind: NormScale | null }) {
  const t = useTranslations("scaleInfo");
  const band = useTranslations("profileChart.band");

  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-hidden transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring print:hidden"
        aria-label={t("open", { scale: name })}
        data-scale-info
      >
        <CircleHelp className="size-3.5" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-80 flex-col gap-3 text-sm">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">{t("title")}</p>
          <p className="font-medium leading-snug">{name}</p>
          <p className="leading-relaxed text-muted-foreground">{info?.description ?? t("noDescription")}</p>
        </div>
        {kind && (
          <dl className="flex flex-col gap-2 border-t pt-3">
            {(["low", "average", "high"] as const).map((key) => (
              <div key={key}>
                <dt className="flex items-baseline gap-1.5 font-medium">
                  {band(key)}
                  <span className="font-mono text-xs font-normal text-muted-foreground">{RANGES[kind][key]}</span>
                </dt>
                <dd className="line-clamp-4 leading-relaxed text-muted-foreground">{info?.readings[key] ?? t(`generic.${key}`)}</dd>
              </div>
            ))}
          </dl>
        )}
        {info && kind && (
          <p className="border-t pt-3 text-xs text-muted-foreground">
            {info.assumed ? t("reliabilityAssumed", { alpha: info.reliability }) : t("reliability", { alpha: info.reliability })}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
