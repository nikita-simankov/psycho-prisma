"use client";

import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { key: "forms", href: "/forms" },
  { key: "tests", href: "/tests" },
] as const;

export function RespondentNav() {
  const t = useTranslations("respondent");
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {LINKS.map(({ key, href }) => {
        const active = pathname === href || pathname.startsWith(href + "/");

        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-2.5 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3",
              active && "bg-card text-foreground shadow-sm"
            )}
          >
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
