import { cn } from "@/utils/utils";
import { Fragment } from "react";
import { MaskedWord, plainText, splitWords } from "./split-heading";

// The hero's title. Its letters rise in on load, and the emphasised word at the end cycles through
// `alternates` (the first alternate is the title's own word). Screen readers get the title as
// written, once; everything drawn is decorative. Without JavaScript only the title's own word shows.
export function HeroTitle({ text, alternates, className }: { text: string; alternates: string[]; className?: string }) {
  const words = splitWords(text);
  const lead = words.filter((word) => !word.emphasis);
  const emphasis = words.filter((word) => word.emphasis).map((word) => word.word).join(" ");
  const cycle = [emphasis, ...alternates.filter((word) => word !== emphasis)];

  return (
    <h1 className={className} data-hero-title>
      <span className="sr-only">{plainText(text)}</span>
      <span aria-hidden>
        {lead.map(({ word }, index) => (
          <Fragment key={index}>
            <MaskedWord word={word} chars />{" "}
          </Fragment>
        ))}
        {/* Every alternate sits in the same grid cell, so the line never reflows as they change. */}
        <span data-rotator className="inline-grid overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
          {cycle.map((word, index) => (
            <span
              key={word}
              data-rotator-item
              className={cn("col-start-1 row-start-1 inline-block whitespace-nowrap pr-[0.06em] font-normal italic text-primary", index > 0 && "invisible")}
            >
              {Array.from(word).map((char, charIndex) => (
                <span key={charIndex} data-char className="inline-block">
                  {char}
                </span>
              ))}
            </span>
          ))}
        </span>
      </span>
    </h1>
  );
}
