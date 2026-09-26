import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

// Public legal and security documents. Their copy lives in messages/legal/<locale>.json:
// <doc>.title, .lead, .version and .sections.<key>.{title, body}, where body is a list of
// paragraphs and a nested list is rendered as bullets.

export type LegalDocumentKey = "terms" | "dpa" | "subprocessors" | "refunds" | "security";

type Paragraph = string | string[];
type Sections = Record<string, { title: string; body: Paragraph[] }>;

// "26 September 2026" in the copy, as a machine-readable date for <time>.
const LAST_UPDATED = "2026-09-26";

export async function legalMetadata(doc: LegalDocumentKey, canonical: string) {
  const t = await getTranslations(`legal.${doc}`);
  return { title: t("metaTitle"), description: t("lead"), alternates: { canonical } };
}

// Square-bracketed text is a value the owner still has to fill in; it is set off so nobody misses it.
export function WithPlaceholders({ text }: { text: string }) {
  return text.split(/(\[[^\]]+\])/).map((part, index) =>
    part.startsWith("[") && part.endsWith("]") ? (
      <span key={index} className="rounded-sm bg-accent px-1 font-medium text-accent-foreground">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function Body({ body }: { body: Paragraph[] }) {
  return body.map((paragraph, index) =>
    Array.isArray(paragraph) ? (
      <ul key={index} className="flex list-disc flex-col gap-2 pl-5 marker:text-muted-foreground">
        {paragraph.map((item, itemIndex) => (
          <li key={itemIndex}>
            <WithPlaceholders text={item} />
          </li>
        ))}
      </ul>
    ) : (
      <p key={index}>
        <WithPlaceholders text={paragraph} />
      </p>
    ),
  );
}

export async function LegalDocument({
  doc,
  eyebrow,
  slots = {},
  showIndexLink = true,
}: {
  doc: LegalDocumentKey;
  eyebrow: string;
  // Extra content (such as a table) placed at the end of the section with that key.
  slots?: Record<string, React.ReactNode>;
  showIndexLink?: boolean;
}) {
  const t = await getTranslations(`legal.${doc}`);
  const common = await getTranslations("legal.common");
  const sections = Object.entries(t.raw("sections") as Sections);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,42rem)_14rem] lg:justify-between">
          <article className="min-w-0">
            <header className="flex flex-col gap-4 pb-10">
              {showIndexLink && (
                <Link href="/legal" className="w-fit text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  {common("allDocuments")}
                </Link>
              )}
              <Eyebrow>{eyebrow}</Eyebrow>
              <h1 className="text-4xl font-medium leading-[1.1] sm:text-5xl">{t("title")}</h1>
              <p className="text-lg text-muted-foreground">
                <WithPlaceholders text={t("lead")} />
              </p>
              <p className="text-sm text-muted-foreground">
                {common("version", { version: t("version") })}
                <span aria-hidden="true"> · </span>
                {common("lastUpdatedLabel")} <time dateTime={LAST_UPDATED}>{common("lastUpdated")}</time>
              </p>
            </header>
            <div className="flex flex-col gap-10">
              {sections.map(([key, section], index) => (
                <section key={key} id={key} aria-labelledby={`${key}-title`} className="scroll-mt-24 border-t border-foreground/80 pt-4">
                  <h2 id={`${key}-title`} className="mb-4 flex items-baseline gap-3 text-xl font-medium">
                    <span className="font-mono text-base font-normal tabular-nums text-muted-foreground">{index + 1}.</span>
                    <span>{section.title}</span>
                  </h2>
                  <div className="flex flex-col gap-4 leading-relaxed">
                    <Body body={section.body} />
                    {slots[key]}
                  </div>
                </section>
              ))}
            </div>
          </article>
          <aside className="hidden lg:block">
            <nav aria-label={common("contents")} className="sticky top-24 flex flex-col gap-3 border-t border-foreground/80 pt-4 text-sm">
              <Eyebrow>{common("contents")}</Eyebrow>
              <ol className="flex flex-col gap-2">
                {sections.map(([key, section], index) => (
                  <li key={key} className="flex gap-2">
                    <span className="font-mono tabular-nums text-muted-foreground">{index + 1}.</span>
                    <a href={`#${key}`} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
