import { badgeVariants } from "@/components/ui/badge";
import { FLAG_STYLES, isFlag } from "@/utils/flags";
import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";

// Restricted follow-up flag. Renders nothing when there is none or the viewer may not see it.
export function FlagBadge({ flag }: { flag: string }) {
  const t = useTranslations("flags");

  if (!isFlag(flag)) {
    return null;
  }

  return (
    // A span, not the div Badge renders, so it can sit inside paragraphs and links.
    <span className={cn(badgeVariants({ variant: "outline" }), "border-transparent font-medium", FLAG_STYLES[flag].badge)}>
      {t(flag)}
    </span>
  );
}
