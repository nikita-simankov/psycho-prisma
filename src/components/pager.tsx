import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

// Previous / next links for a server-paginated list. Keeps the rest of the query string.
export async function Pager({
  page,
  pages,
  path,
  query = {},
  labels,
}: {
  page: number;
  pages: number;
  path: string;
  query?: Record<string, string | undefined>;
  // Lists sorted newest first read better as "Newer" / "Older".
  labels?: { previous: string; next: string };
}) {
  if (pages <= 1) return null;
  const t = await getTranslations("common.pager");
  const href = (target: number) => {
    const params = new URLSearchParams(Object.entries({ ...query, page: target > 1 ? String(target) : undefined }).filter((entry): entry is [string, string] => Boolean(entry[1])));
    const search = params.toString();
    return search ? `${path}?${search}` : path;
  };
  const previous = labels?.previous ?? t("previous");
  const next = labels?.next ?? t("next");

  return (
    <nav className="mt-4 flex items-center justify-between gap-2" aria-label={t("label")}>
      <Button variant="outline" size="sm" asChild={page > 1} disabled={page <= 1}>
        {page > 1 ? <Link href={href(page - 1)}>{previous}</Link> : <span>{previous}</span>}
      </Button>
      <span className="text-sm text-muted-foreground">{t("page", { page, pages })}</span>
      <Button variant="outline" size="sm" asChild={page < pages} disabled={page >= pages}>
        {page < pages ? <Link href={href(page + 1)}>{next}</Link> : <span>{next}</span>}
      </Button>
    </nav>
  );
}
