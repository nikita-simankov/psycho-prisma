"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, Fragment, useContext, useEffect, useState } from "react";

// Path segments with a fixed name. Anything else (an id) takes the page's title.
const SEGMENT_LABELS = {
  rounds: "rounds",
  new: "new",
  forms: "forms",
  tests: "tests",
  people: "people",
  teams: "teams",
  "follow-up": "followUp",
  reports: "reports",
  analytics: "analytics",
  settings: "settings",
  audit: "audit",
  results: "results",
  run: "run",
} as const;

type Segment = keyof typeof SEGMENT_LABELS;

const TitleContext = createContext<{ title: string | null; setTitle: (title: string | null) => void } | null>(null);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState<string | null>(null);
  return <TitleContext.Provider value={{ title, setTitle }}>{children}</TitleContext.Provider>;
}

// Rendered by PageHeader so the last crumb shows the page's own title.
export function BreadcrumbTitle({ title }: { title: string }) {
  const context = useContext(TitleContext);

  useEffect(() => {
    context?.setTitle(title);
    return () => context?.setTitle(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  return null;
}

export function AppBreadcrumbs({ base }: { base: string }) {
  const t = useTranslations("dashboard.crumbs");
  const pathname = usePathname();
  const title = useContext(TitleContext)?.title;
  const segments = pathname.slice(base.length).split("/").filter(Boolean);

  const crumbs: { label: string; href: string }[] = [{ label: t("home"), href: base }];
  segments.forEach((segment, index) => {
    const href = `${base}/${segments.slice(0, index + 1).join("/")}`;
    const last = index === segments.length - 1;

    if (segment in SEGMENT_LABELS) {
      crumbs.push({ label: t(SEGMENT_LABELS[segment as Segment]), href });
    } else if (last && title) {
      crumbs.push({ label: title, href });
    }
  });

  // On a page whose last segment is a fixed name, a distinct page title adds the entity it belongs to.
  const lastSegment = segments[segments.length - 1];
  if (title && lastSegment in SEGMENT_LABELS && crumbs.length > 1 && crumbs[crumbs.length - 1].label !== title) {
    const current = crumbs.pop()!;
    crumbs.push({ label: title, href: current.href });
  }

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <Fragment key={crumb.href + index}>
              {index > 0 && <BreadcrumbSeparator className="hidden sm:block" />}
              <BreadcrumbItem className={!last ? "hidden sm:inline-flex" : "min-w-0"}>
                {last ? (
                  <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
