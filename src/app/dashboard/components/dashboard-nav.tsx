"use client";

import { can } from "@/utils/roles";
import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_NAVIGATION } from "./navigation";

// The most specific section that contains the current path is highlighted.
function activeHref(pathname: string, links: readonly { href: string }[]) {
  return links.map((link) => link.href)
    .filter((href) => pathname === href || pathname.startsWith(href + "/"))
    .sort((a, b) => b.length - a.length)[0];
}

export function DashboardNav({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const t = useTranslations("dashboard.nav");
  const pathname = usePathname();
  const links = DASHBOARD_NAVIGATION.filter((link) => !("permission" in link) || can(role, link.permission));
  const active = activeHref(pathname, links);

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ key, href, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          onClick={onNavigate}
          aria-current={href === active ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
            href === active && "bg-accent text-accent-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {t(key)}
        </Link>
      ))}
    </nav>
  );
}
