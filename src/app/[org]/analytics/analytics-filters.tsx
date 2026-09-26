"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { filtersToQuery, type FilterKey, type Filters } from "@/utils/analytics-filters";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

const ALL = "__all__";

type Option = { id: string; name: string };

// Filters in one row above the charts; each change updates the address so views can be saved and shared.
export function AnalyticsFilters({
  filters,
  options,
}: {
  filters: Filters;
  options: { teams: Option[]; positions: string[]; rounds: Option[]; tests: Option[] };
}) {
  const t = useTranslations("analytics.filters");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const apply = (next: Filters) => {
    const query = filtersToQuery(next);
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  };
  const set = (key: FilterKey, value: string | undefined) => apply({ ...filters, [key]: value === ALL ? undefined : value || undefined });

  const selects: { key: FilterKey; label: string; all: string; items: Option[] }[] = [
    { key: "team", label: t("team"), all: t("allTeams"), items: options.teams },
    { key: "position", label: t("position"), all: t("allPositions"), items: options.positions.map((position) => ({ id: position, name: position })) },
    { key: "round", label: t("round"), all: t("allRounds"), items: options.rounds },
  ];

  return (
    <div className="flex flex-wrap items-end gap-3" aria-busy={pending}>
      {options.tests.length > 0 && (
        <div className="flex min-w-48 flex-1 flex-col gap-1.5 sm:max-w-64">
          <Label className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-muted-foreground" htmlFor="filter-test">{t("test")}</Label>
          <Select value={filters.test ?? ""} onValueChange={(value) => set("test", value)}>
            <SelectTrigger id="filter-test">
              <SelectValue placeholder={t("mostTaken")} />
            </SelectTrigger>
            <SelectContent>
              {options.tests.map((test) => (
                <SelectItem key={test.id} value={test.id}>
                  {test.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {selects.map((select) => (
        <div key={select.key} className="flex min-w-40 flex-1 flex-col gap-1.5 sm:max-w-56">
          <Label className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-muted-foreground" htmlFor={`filter-${select.key}`}>{select.label}</Label>
          <Select value={filters[select.key] ?? ALL} onValueChange={(value) => set(select.key, value)}>
            <SelectTrigger id={`filter-${select.key}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{select.all}</SelectItem>
              {select.items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      <div className="flex flex-col gap-1.5">
        <Label className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-muted-foreground" htmlFor="filter-from">{t("from")}</Label>
        <Input id="filter-from" type="date" className="w-40" value={filters.from ?? ""} max={filters.to} onChange={(event) => set("from", event.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-muted-foreground" htmlFor="filter-to">{t("to")}</Label>
        <Input id="filter-to" type="date" className="w-40" value={filters.to ?? ""} min={filters.from} onChange={(event) => set("to", event.target.value)} />
      </div>
      {Object.keys(filters).length > 0 && (
        <Button variant="ghost" onClick={() => apply({})}>
          {t("reset")}
        </Button>
      )}
    </div>
  );
}
