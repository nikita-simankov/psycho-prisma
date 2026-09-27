import { EmptyState } from "@/components/empty-state";
import { cn } from "@/utils/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export type LinkListItem = {
  id: string;
  href: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  // A checkbox beside the row, outside the link, for picking rows in a surrounding form.
  // Its value is the item's id.
  select?: { name: string; label: string };
};

// Rows that each open a detail page: people, results, archived reports.
export function LinkList({
  items,
  empty,
  emptyText,
  className,
}: {
  items: LinkListItem[];
  empty: React.ReactNode;
  // What to do to fill the list, under the empty title.
  emptyText?: React.ReactNode;
  className?: string;
}) {
  if (items.length === 0) {
    return <EmptyState title={empty} description={emptyText} className="py-6" />;
  }

  return (
    <ul className={cn("divide-y", className)}>
      {items.map((item) => (
        <li key={item.id} className={cn(item.select && "flex items-center gap-1")}>
          {item.select && (
            <input
              type="checkbox"
              name={item.select.name}
              value={item.id}
              aria-label={item.select.label}
              className="ml-2 size-4 shrink-0 accent-primary print:hidden"
            />
          )}
          <Link
            href={item.href}
            className={cn("flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-accent", item.select && "min-w-0 flex-1")}
          >
            {item.leading}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.title}</p>
              {item.subtitle && <p className="truncate text-sm text-muted-foreground">{item.subtitle}</p>}
            </div>
            {item.trailing && <div className="hidden shrink-0 text-xs text-muted-foreground sm:block">{item.trailing}</div>}
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
