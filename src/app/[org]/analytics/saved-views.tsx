"use client";

import { cn } from "@/utils/utils";
import { deleteAnalyticsView, saveAnalyticsView } from "@/actions/analytics/analytics-view-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Bookmark, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

// The signed-in person's saved filter sets, and a button to save the current one.
export function SavedViews({ views, query }: { views: { id: string; name: string; query: string }[]; query: string }) {
  const t = useTranslations("analytics.views");
  const common = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      const result = await saveAnalyticsView(name, query);
      if ("error" in result) throw new Error(t("tooMany"));
    },
    onSuccess: () => {
      toast({ title: t("saved") });
      setName("");
      setOpen(false);
      router.refresh();
    },
    onError: (error) => toast({ title: common("error"), description: error.message, variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteAnalyticsView(id),
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {views.map((view) => {
        const active = view.query === query;
        return (
          <span
            key={view.id}
            className={cn(
              "flex h-8 items-center rounded-md border text-sm transition-colors",
              active ? "border-foreground bg-foreground text-background" : "bg-card hover:border-foreground/40",
            )}
          >
            <Link
              href={view.query ? `${pathname}?${view.query}` : pathname}
              className={cn("px-3", active && "font-medium")}
              aria-current={active ? "page" : undefined}
            >
              {view.name}
            </Link>
            <button
              type="button"
              className={cn("mr-1 rounded-sm p-1 opacity-60 hover:opacity-100", active ? "hover:bg-background/15" : "hover:bg-muted")}
              aria-label={t("delete", { name: view.name })}
              onClick={() => remove.mutate(view.id)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        );
      })}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm">
            <Bookmark className="size-4" />
            {t("save")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72">
          <form
            className="flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate();
            }}
          >
            <label htmlFor="view-name" className="text-sm font-medium">
              {t("name")}
            </label>
            <Input id="view-name" required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} placeholder={t("placeholder")} />
            <Button type="submit" size="sm" disabled={save.isPending || !name.trim()}>
              {common("save")}
            </Button>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
