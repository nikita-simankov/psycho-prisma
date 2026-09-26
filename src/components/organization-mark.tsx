import { cn } from "@/utils/utils";

// An organization's mark: its initial for now. This is the slot an uploaded logo will fill later.
export function OrganizationMark({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex aspect-square size-8 shrink-0 items-center justify-center rounded-md bg-foreground font-heading text-sm font-medium text-background",
        className,
      )}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
