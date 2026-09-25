"use client";

import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";

interface Properties {
  withText?: boolean;
  className?: string;
}

// A prism splitting one ray into three: the product mark.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("w-9 h-9 shrink-0", className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path d="M2 18.5 L12.2 16.2" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
      <path d="M16 7.5 L24.5 23 H7.5 Z" fill="white" fillOpacity="0.14" stroke="white" strokeWidth="2" strokeLinejoin="round" />
      <path d="M19.6 15.2 L30 11.5" stroke="#fcd34d" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M19.9 16 L30 16" stroke="#6ee7b7" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M19.6 16.8 L30 20.5" stroke="#f9a8d4" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ withText, className }: Properties) {
  const t = useTranslations("common");

  return (
    <div className={cn("flex flex-row items-center gap-2.5", className)}>
      <LogoMark />
      {withText && <span className="font-heading font-bold text-lg tracking-tight">{t("appName")}</span>}
    </div>
  );
}
