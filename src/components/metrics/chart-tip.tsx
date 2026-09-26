"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Hover and focus tooltip for one chart mark. The mark stays a focusable element so the value
// is reachable from the keyboard, and its aria-label repeats the tooltip for screen readers.
export function ChartTip({ label, className, style, children }: { label: string; className?: string; style?: React.CSSProperties; children?: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={80}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} role="img" aria-label={label} className={className} style={style}>
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className="whitespace-pre-line text-xs">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
