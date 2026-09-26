"use client";

import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";

interface Properties {
  withText?: boolean;
  className?: string;
}

// The Calibre mark: an open ring, like a gauge's jaws, with the measured mark in the gap.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="7" className="fill-foreground" />
      <path d="M22.9 10.2 A9 9 0 1 0 22.9 21.8" fill="none" strokeWidth="3" className="stroke-background" />
      <rect x="20.5" y="14.6" width="6" height="2.8" rx="0.6" className="fill-primary" />
    </svg>
  );
}

// The mark and the name set in Literata: the wordmark.
export default function Logo({ withText, className }: Properties) {
  const t = useTranslations("common");

  return (
    <div className={cn("flex flex-row items-center gap-2.5", className)}>
      <LogoMark />
      {withText && <span className="font-heading text-xl font-medium tracking-tight">{t("appName")}</span>}
    </div>
  );
}
