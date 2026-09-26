"use client";

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
          <span key={view.id} className="flex items-center rounded-full border bg-card text-sm">
            <Link
              href={view.query ? `${pathname}?${view.query}` : pathname}
              className={active ? "px-3 py-1 font-medium text-primary" : "px-3 py-1"}
              aria-current={active ? "page" : undefined}
            >
              {view.name}
            </Link>
            <button
              type="button"
              className="mr-1 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
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
          <Button variant="outline" size="sm">
            <Bookmark className="mr-2 h-4 w-4" />
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
