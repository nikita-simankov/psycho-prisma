"use client";

import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import type { Support } from "@/utils/wellbeing";
import { ArrowRight, ExternalLink, HeartHandshake } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

// Shown straight after submitting when the result suggests the person may be struggling: the
// organization's own words, contacts and links, or a general note when it has none. It never
// mentions scores; the answers are saved either way.
export function SupportStep({ support, onContinue }: { support: Support; onContinue: () => void }) {
  const t = useTranslations("wellbeing.support");
  const heading = useRef<HTMLHeadingElement>(null);
  const empty = !support.text && !support.contacts && !support.links.length;

  // Screen readers land on the new content rather than the button that disappeared.
  useEffect(() => heading.current?.focus(), []);

  return (
    <section aria-labelledby="support-heading" className="flex w-full flex-col gap-5 border-t border-foreground/80 pt-6" data-support>
      <Eyebrow className="flex items-center gap-1.5 text-primary">
        <HeartHandshake className="size-3.5" aria-hidden />
        {t("eyebrow")}
      </Eyebrow>
      <h2 id="support-heading" ref={heading} tabIndex={-1} className="font-heading text-3xl font-normal leading-tight outline-none">
        {t("title")}
      </h2>
      <p className="max-w-xl text-muted-foreground">{t("intro")}</p>
      {support.text && <p className="max-w-xl whitespace-pre-line leading-relaxed">{support.text}</p>}
      {support.contacts && (
        <div className="flex max-w-xl flex-col gap-1 rounded-lg border bg-card p-4">
          <p className="text-sm font-medium">{t("contacts")}</p>
          <p className="whitespace-pre-line text-sm">{support.contacts}</p>
        </div>
      )}
      {support.links.length > 0 && (
        <ul className="flex max-w-xl flex-col gap-2">
          {support.links.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
              >
                {link.label}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}
      {empty && <p className="max-w-xl text-sm">{t("fallback")}</p>}
      <p className="max-w-xl text-sm text-muted-foreground">{t("urgent")}</p>
      <div className="mt-3">
        <Button size="lg" onClick={onContinue}>
          {t("continue")}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  );
}
