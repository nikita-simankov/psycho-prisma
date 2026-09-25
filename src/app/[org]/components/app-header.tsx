"use client";

import { AppBreadcrumbs } from "@/components/breadcrumbs";
import { useOrganizationBase } from "@/components/organization-provider";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTranslations } from "next-intl";
import DashboardSearch, { type SearchData } from "./dashboard-search";

export function AppHeader({ search }: { search: SearchData }) {
  const t = useTranslations("dashboard");
  const base = useOrganizationBase();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 rounded-t-xl border-b bg-background/85 px-3 backdrop-blur print:hidden sm:px-4">
      <SidebarTrigger className="-ml-1" label={t("toggleSidebar")} />
      <Separator orientation="vertical" className="mr-1 h-4" />
      <div className="min-w-0 flex-1">
        <AppBreadcrumbs base={base} />
      </div>
      <DashboardSearch {...search} />
    </header>
  );
}
