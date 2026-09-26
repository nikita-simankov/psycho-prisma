"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

const ALL = "__all__";

export function AuditFilters({
  action,
  person,
  actions,
  people,
}: {
  action?: string;
  person?: string;
  actions: { key: string; label: string }[];
  people: { id: string; name: string }[];
}) {
  const t = useTranslations("audit");
  const router = useRouter();
  const pathname = usePathname();

  const apply = (next: { action?: string; person?: string }) => {
    const params = new URLSearchParams();
    if (next.action) params.set("action", next.action);
    if (next.person) params.set("person", next.person);
    router.push(params.size ? `${pathname}?${params}` : pathname);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-48 flex-1 flex-col gap-1.5 sm:max-w-64">
        <Label htmlFor="audit-person">{t("person")}</Label>
        <Select value={person ?? ALL} onValueChange={(value) => apply({ action, person: value === ALL ? undefined : value })}>
          <SelectTrigger id="audit-person">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("everyone")}</SelectItem>
            {people.map((entry) => (
              <SelectItem key={entry.id} value={entry.id}>
                {entry.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex min-w-48 flex-1 flex-col gap-1.5 sm:max-w-64">
        <Label htmlFor="audit-action">{t("action")}</Label>
        <Select value={action ?? ALL} onValueChange={(value) => apply({ person, action: value === ALL ? undefined : value })}>
          <SelectTrigger id="audit-action">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("allActions")}</SelectItem>
            {actions.map((entry) => (
              <SelectItem key={entry.key} value={entry.key}>
                {entry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
