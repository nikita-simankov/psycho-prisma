import { cn } from "@/utils/utils";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface Properties {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  className?: string;
}

export function PageHeader({ title, description, actions, back, className }: Properties) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        {back && (
          <Link
            href={back.href}
            className="print:hidden mb-1 inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="print:hidden flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
