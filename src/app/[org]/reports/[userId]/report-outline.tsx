import { useTranslations } from "next-intl";

// Links to each part of a long report, beside it on wide screens.
export function ReportOutline({ items }: { items: { id: string; label: string; hint?: string }[] }) {
  const t = useTranslations("report");

  return (
    <nav aria-label={t("outline")} className="sticky top-20 hidden max-h-[calc(100vh-6rem)] overflow-y-auto lg:block print:hidden">
      <p className="mb-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">{t("outline")}</p>
      <ol className="flex flex-col gap-0.5 border-l text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="-ml-px block border-l border-transparent py-1 pl-3 text-muted-foreground hover:border-primary hover:text-foreground">
              <span className="line-clamp-2">{item.label}</span>
              {item.hint && <span className="block font-mono text-[0.6875rem]">{item.hint}</span>}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
