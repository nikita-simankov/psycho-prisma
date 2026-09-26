import { cn } from "@/utils/utils";

// A keyboard key hint, such as the number keys in the runner or Ctrl K for search.
export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-b-2 bg-card px-1 font-mono text-[0.6875rem] font-medium leading-none text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
