import { cn } from "@/utils/utils";

// The small mono label above a title or a group ("Due in 3 days", "Assess").
export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("font-mono text-[0.6875rem] font-medium uppercase leading-none tracking-[0.1em] text-muted-foreground", className)}
      {...props}
    />
  );
}
