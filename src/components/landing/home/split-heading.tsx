import { cn } from "@/utils/utils";
import { Fragment } from "react";

type Level = "h1" | "h2";

// A heading whose words the landing's motion can raise one by one. Screen readers get the whole
// sentence once from a visually hidden copy; the split words are decorative and hidden from them.
// Without JavaScript the words simply show. Text between <em> and </em> is set in the accent italic.
export function SplitHeading({
  as: Tag = "h2",
  text,
  className,
  intro,
}: {
  as?: Level;
  text: string;
  className?: string;
  // Hero words animate on load rather than on scroll.
  intro?: boolean;
}) {
  const parts = text.split(/(<em>.*?<\/em>)/).filter(Boolean);
  const words = parts.flatMap((part) => {
    const emphasis = part.startsWith("<em>");
    return part
      .replace(/<\/?em>/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({ word, emphasis }));
  });

  return (
    <Tag className={className} data-split={intro ? undefined : ""}>
      <span className="sr-only">{text.replace(/<\/?em>/g, "")}</span>
      <span aria-hidden>
        {words.map(({ word, emphasis }, index) => (
          <Fragment key={index}>
            <span className="inline-block overflow-hidden pb-[0.1em] align-bottom" {...(intro ? { "data-hero-word": "" } : {})}>
              <span data-word className={cn("inline-block", emphasis && "pr-[0.06em] font-normal italic text-primary")}>
                {word}
              </span>
            </span>
            {index < words.length - 1 && " "}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
