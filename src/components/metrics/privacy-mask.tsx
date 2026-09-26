import { MIN_GROUP } from "@/utils/results";
import { cn } from "@/utils/utils";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

// What stands in for any figure held back because its group is smaller than MIN_GROUP: the same
// hatched patch, lock and wording everywhere, so a hidden group is never mistaken for a zero.
// "block" fills a row or card, "cell" fits a table cell or a bar's place.
export function PrivacyMask({
  variant = "block",
  label,
  className,
}: {
  variant?: "block" | "cell";
  // What was hidden (a team's name), for screen readers and the tooltip.
  label?: string;
  className?: string;
}) {
  const t = useTranslations("privacyMask");
  const text = t("hidden", { min: MIN_GROUP });

  return (
    <span
      data-privacy-mask
      title={label ? `${label}: ${text}` : text}
      className={cn(
        "flex items-center gap-1.5 rounded-[4px] border border-dashed border-border text-muted-foreground",
        "bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--border)_6px_7px)] print:bg-none",
        variant === "block" ? "px-3 py-2 text-xs" : "justify-center px-1.5 py-1.5 text-[0.6875rem]",
        className
      )}
    >
      <Lock className={cn("shrink-0", variant === "block" ? "size-3.5" : "size-3")} aria-hidden />
      <span className={cn(variant === "cell" && "sr-only")}>
        {label && <span className="sr-only">{label}: </span>}
        {text}
      </span>
    </span>
  );
}
