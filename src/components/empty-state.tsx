import { cn } from "@/utils/utils";
import { Inbox, type LucideIcon } from "lucide-react";

// What a list shows when it has nothing in it.
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 px-4 py-12 text-center", className)}>
      <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-md border bg-card">
        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
      </div>
      <p className="font-heading text-lg font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
