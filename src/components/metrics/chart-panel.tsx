import { cn } from "@/utils/utils";
import { SeriesMark, type Series } from "./series-mark";

// The frame every small chart sits in: the scale's name on the left, its headline figure or note
// on the right, the drawing below. Keeps titles, figures and spacing identical across charts.
export function ChartPanel({
  title,
  aside,
  className,
  children,
}: {
  title: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <figure className={cn("flex flex-col gap-3 rounded-lg border bg-card p-4 break-inside-avoid", className)}>
      <figcaption className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium leading-snug">{title}</span>
        {aside && <span className="flex shrink-0 items-baseline gap-1.5 font-mono text-sm tabular-nums">{aside}</span>}
      </figcaption>
      {children}
    </figure>
  );
}

// The shared legend: each series' mark (colour and shape) with its label.
export function ChartLegend({ items, className }: { items: { series: Series; label: string }[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-muted-foreground", className)}>
      {items.map((entry) => (
        <li key={entry.series} className="flex items-center gap-1.5">
          <SeriesMark series={entry.series} />
          {entry.label}
        </li>
      ))}
    </ul>
  );
}
