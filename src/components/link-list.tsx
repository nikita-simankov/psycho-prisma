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
};

// Rows that each open a detail page: people, results, archived reports.
export function LinkList({ items, empty, className }: { items: LinkListItem[]; empty: React.ReactNode; className?: string }) {
  if (items.length === 0) {
    return <EmptyState title={empty} className="py-6" />;
  }

  return (
    <ul className={cn("divide-y", className)}>
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-accent"
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
