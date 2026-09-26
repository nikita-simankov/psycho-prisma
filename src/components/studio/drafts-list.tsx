import { Badge } from "@/components/ui/badge";
import type { InstrumentKind } from "@/utils/instrument-content";
import { organizationBase } from "@/utils/organization-path";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

type Draft = { id: string; name: string; version: number; updatedAt: Date };

// The organization's unpublished work, above the library it will join.
export async function DraftsList({ kind, drafts }: { kind: InstrumentKind; drafts: Draft[] }) {
  if (drafts.length === 0) return null;
  const t = await getTranslations("studio.drafts");
  const format = await getFormatter();
  const base = await organizationBase();

  return (
    <section className="mb-8" aria-labelledby="drafts-title">
      <h2 id="drafts-title" className="mb-3 text-sm font-semibold text-muted-foreground">
        {t("title")}
      </h2>
      <ul className="divide-y rounded-lg border bg-card">
        {drafts.map((draft) => (
          <li key={draft.id}>
            <Link
              href={`${base}/${kind === "test" ? "tests" : "forms"}/${draft.id}/edit`}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-muted/50"
            >
              <span className="w-full min-w-0 truncate font-medium sm:w-auto sm:flex-1">{draft.name}</span>
              <Badge variant="outline">{draft.version === 0 ? t("new") : t("changes", { version: draft.version })}</Badge>
              <span className="text-xs text-muted-foreground">{t("edited", { when: format.relativeTime(draft.updatedAt) })}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
