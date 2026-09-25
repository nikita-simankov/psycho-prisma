"use client";

import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/utils";
import { ChevronRight, Clock, FlaskConical, HelpCircle, NotepadText } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

export type CatalogItem = {
  id: string;
  name: string;
  categories: { id: string; name: string }[];
  questionCount: number;
  minutes: number;
};

// Everything a respondent can take, filterable by category.
export function Catalog({ items, hrefPrefix, kind }: { items: CatalogItem[]; hrefPrefix: string; kind: "form" | "test" }) {
  const t = useTranslations("respondent");
  const common = useTranslations("common");
  const [category, setCategory] = useState<string>();
  const categories = Array.from(
    new Map(items.flatMap((item) => item.categories).map((c) => [c.id, c.name])).entries()
  );
  const visible = category ? items.filter((item) => item.categories.some((c) => c.id === category)) : items;
  const Icon = kind === "form" ? NotepadText : FlaskConical;

  if (items.length === 0) {
    return (
      <Card>
        <EmptyState icon={Icon} title={t("empty")} />
      </Card>
    );
  }

  const chip = (id: string | undefined, label: string) => (
    <button
      key={id ?? "all"}
      type="button"
      onClick={() => setCategory(id)}
      aria-pressed={category === id}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/50",
        category === id ? "border-primary bg-primary text-primary-foreground hover:border-primary" : "bg-card text-muted-foreground"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      {categories.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {chip(undefined, t("all"))}
          {categories.map(([id, name]) => chip(id, name))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visible.map((item) => (
          <Link key={item.id} href={hrefPrefix + item.id} className="group">
            <Card className="flex h-full items-center gap-4 p-4 transition-colors group-hover:border-primary/40">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-medium leading-snug">{item.name}</p>
                <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5" />
                    {t("questionCount", { count: item.questionCount })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {common("minutes", { count: item.minutes })}
                  </span>
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
