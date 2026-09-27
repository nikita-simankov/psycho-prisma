import { cn } from "@/utils/utils";
import { Fragment } from "react";

type Level = "h1" | "h2";

// Splits "plain <em>emphasis</em> plain" into words, remembering which are emphasised.
export function splitWords(text: string) {
  return text
    .split(/(<em>.*?<\/em>)/)
    .filter(Boolean)
    .flatMap((part) => {
      const emphasis = part.startsWith("<em>");
      return part
        .replace(/<\/?em>/g, "")
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => ({ word, emphasis }));
    });
}

export const plainText = (text: string) => text.replace(/<\/?em>/g, "");

const EMPHASIS = "pr-[0.06em] font-normal italic text-primary";

// One word inside its mask. With `chars`, each letter is its own element so it can rise separately.
export function MaskedWord({ word, emphasis, chars }: { word: string; emphasis?: boolean; chars?: boolean }) {
  return (
    <span data-mask className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
      <span data-word className={cn("inline-block whitespace-nowrap will-change-transform", emphasis && EMPHASIS)}>
        {chars
          ? Array.from(word).map((char, index) => (
              <span key={index} data-char className="inline-block">
                {char}
              </span>
            ))
          : word}
      </span>
    </span>
  );
}

// A heading whose words (or letters) the landing's motion raises one by one. Screen readers get the
// whole sentence once from a visually hidden copy; the split words are decorative and hidden from
// them. Without JavaScript the words simply show. Text between <em> and </em> is set in the accent
// italic.
export function SplitHeading({
  as: Tag = "h2",
  text,
  className,
  chars,
}: {
  as?: Level;
  text: string;
  className?: string;
  // Letters rise one by one rather than whole words; for short, large headings.
  chars?: boolean;
}) {
  const words = splitWords(text);
  return (
    <Tag className={className} data-split={chars ? "chars" : "words"}>
      <span className="sr-only">{plainText(text)}</span>
      <span aria-hidden>
        {words.map(({ word, emphasis }, index) => (
          <Fragment key={index}>
            <MaskedWord word={word} emphasis={emphasis} chars={chars} />
            {index < words.length - 1 && " "}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
