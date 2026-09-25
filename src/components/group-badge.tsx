import { Badge } from "@/components/ui/badge";
import { GROUP_STYLES, isUserGroup } from "@/utils/groups";
import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";

export function GroupBadge({ group }: { group: string }) {
  const t = useTranslations("groups");

  if (!isUserGroup(group)) {
    return <Badge variant="secondary">{group}</Badge>;
  }

  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", GROUP_STYLES[group].badge)}>
      {t(group)}
    </Badge>
  );
}
