import { Badge } from "@/components/ui/badge";
import type { RoundHealth } from "@/utils/round-health";
import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";

const STYLE: Record<RoundHealth, string> = {
  done: "border-success/40 text-success",
  onTrack: "border-primary/30 text-primary",
  atRisk: "border-warning/50 text-warning",
  overdue: "border-destructive/50 text-destructive",
};

// On track, at risk, overdue or done, the same everywhere a round is listed.
export function HealthChip({ health, className }: { health: RoundHealth; className?: string }) {
  const t = useTranslations("rounds.health");
  return (
    <Badge variant="outline" className={cn("gap-1.5", STYLE[health], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {t(health)}
    </Badge>
  );
}
