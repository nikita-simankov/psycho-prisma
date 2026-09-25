import { Badge } from "@/components/ui/badge";
import { isUserGroup } from "@/utils/groups";
import { useTranslations } from "next-intl";

export function GroupBadge({ group }: { group: string }) {
  const t = useTranslations("groups");

  return (
    <Badge variant={group === "general" ? "secondary" : "destructive"}>
      {isUserGroup(group) ? t(group) : group}
    </Badge>
  );
}
