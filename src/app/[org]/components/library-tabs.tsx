"use client";

import { useOrganizationBase } from "@/components/organization-provider";
import { cn } from "@/utils/utils";
import { FlaskConical, NotepadText } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { key: "tests", path: "/tests", icon: FlaskConical },
  { key: "forms", path: "/forms", icon: NotepadText },
] as const;

// Switches the Library between tests and questionnaires; both are separate pages, so these are links.
export function LibraryTabs() {
  const t = useTranslations("dashboard");
  const base = useOrganizationBase();
  const pathname = usePathname();

  return (
    <nav aria-label={t("libraryLabel")} className="-mt-2 mb-6 flex h-10 items-center gap-5 border-b print:hidden">
      {SECTIONS.map(({ key, path, icon: Icon }) => {
        const href = base + path;
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex h-10 items-center gap-1.5 border-b-2 text-sm font-medium transition-colors",
              active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {t(`nav.${key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
