import { BreadcrumbTitle } from "@/components/breadcrumbs";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/utils/utils";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface Properties {
  title: React.ReactNode;
  // A short mono label above the title: a date, a status, the kind of page.
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  className?: string;
  // What the last breadcrumb says when the title is generic, such as the person's name.
  crumb?: string;
}

export function PageHeader({ title, eyebrow, description, actions, back, className, crumb }: Properties) {
  const crumbTitle = crumb ?? (typeof title === "string" ? title : null);

  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      {crumbTitle && <BreadcrumbTitle title={crumbTitle} />}
      <div className="flex min-w-0 flex-col gap-2">
        {back && (
          <Link
            href={back.href}
            className="print:hidden mb-1 inline-flex w-fit sm:hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            {back.label}
          </Link>
        )}
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="text-3xl font-medium leading-tight sm:text-4xl">{title}</h1>
        {description && <div className="max-w-2xl text-muted-foreground">{description}</div>}
      </div>
      {actions && <div className="print:hidden flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
