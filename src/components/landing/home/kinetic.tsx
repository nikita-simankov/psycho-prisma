import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/utils/utils";
import { Fragment } from "react";

// Small pieces of the landing's type motion. Each is complete as static markup; the landing's motion
// (landing-motion.tsx) finds them by their data attributes and animates them.

// A band of words that drifts sideways, faster while the page scrolls and in the scroll's
// direction. Decorative: everything in it is said elsewhere on the page. The words are repeated so
// the loop has no seam.
export function Marquee({ rows }: { rows: { words: string[]; italic?: boolean; reverse?: boolean }[] }) {
  return (
    <div aria-hidden className="flex select-none flex-col gap-2 overflow-hidden py-8 sm:gap-4 sm:py-12">
      {rows.map((row, index) => (
        <div key={index} data-marquee={row.reverse ? -1 : 1} className="flex w-max whitespace-nowrap">
          {[0, 1].map((copy) => (
            <div key={copy} data-marquee-copy className="flex shrink-0 items-center">
              {row.words.map((word, wordIndex) => (
                <Fragment key={wordIndex}>
                  <span
                    className={cn(
                      "px-4 font-heading text-[clamp(2.25rem,7vw,6.5rem)] leading-[1.05] tracking-[-0.03em] sm:px-8",
                      row.italic ? "italic text-primary" : "text-foreground",
                    )}
                  >
                    {word}
                  </span>
                  <span className="size-2 shrink-0 rounded-full bg-foreground/30 sm:size-3" />
                </Fragment>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// An eyebrow whose letters shuffle before they settle, like an instrument reading in. Screen readers
// get the label once, as written.
export function ScrambleLabel({ children, className, id }: { children: string; className?: string; id?: string }) {
  return (
    <Eyebrow id={id} className={cn("inline-flex items-center gap-2", className)}>
      <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
      <span className="sr-only">{children}</span>
      <span aria-hidden data-scramble>
        {children}
      </span>
    </Eyebrow>
  );
}

// A link or button label that rolls up to a copy of itself on hover and focus. The copy is hidden
// from assistive technology, so the accessible name stays the label. The parent needs `group`.
export function RollLabel({ children }: { children: string }) {
  return (
    <span className="relative inline-flex overflow-hidden">
      <span className="transition-transform duration-500 ease-[var(--ease-calm)] group-hover:-translate-y-full group-focus-visible:-translate-y-full motion-reduce:transition-none">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute inset-0 translate-y-full transition-transform duration-500 ease-[var(--ease-calm)] group-hover:translate-y-0 group-focus-visible:translate-y-0 motion-reduce:transition-none"
      >
        {children}
      </span>
    </span>
  );
}

// The closing figure: a team's distribution and one person's score within it, drawn as the section
// scrolls in. A data graphic built from the normal curve, not an illustration.
const WIDTH = 1200;
const HEIGHT = 280;
function curve(mu: number, sigma: number, amplitude: number, baseline: number) {
  const points: string[] = [];
  for (let step = 0; step <= 120; step++) {
    const x = step / 120;
    const y = baseline - amplitude * Math.exp(-0.5 * ((x - mu) / sigma) ** 2);
    points.push(`${(x * WIDTH).toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${points.join("L")}`;
}
const TEAM = [
  { mu: 0.46, sigma: 0.13, amplitude: 150 },
  { mu: 0.52, sigma: 0.11, amplitude: 190 },
  { mu: 0.5, sigma: 0.16, amplitude: 120 },
];
const PERSON = 0.68;

export function DistributionFigure({ caption, className }: { caption: string; className?: string }) {
  const person = TEAM[1];
  const personTop = HEIGHT - 20 - person.amplitude * Math.exp(-0.5 * ((PERSON - person.mu) / person.sigma) ** 2);
  return (
    <figure data-curve className={cn("flex flex-col gap-3", className)}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden className="h-40 w-full overflow-visible sm:h-56 lg:h-72">
        <line x1="0" x2={WIDTH} y1={HEIGHT - 20} y2={HEIGHT - 20} className="stroke-foreground/30" vectorEffect="non-scaling-stroke" />
        {TEAM.map((team, index) => (
          <path
            key={index}
            data-curve-line
            d={curve(team.mu, team.sigma, team.amplitude, HEIGHT - 20)}
            pathLength={1}
            fill="none"
            vectorEffect="non-scaling-stroke"
            className={index === 1 ? "stroke-foreground stroke-[1.5]" : "stroke-foreground/35"}
          />
        ))}
        <line
          data-curve-tick
          x1={PERSON * WIDTH}
          x2={PERSON * WIDTH}
          y1={HEIGHT - 20}
          y2={personTop}
          pathLength={1}
          vectorEffect="non-scaling-stroke"
          className="stroke-primary stroke-[3]"
        />
      </svg>
      <figcaption className="font-mono text-[0.6875rem] text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}
