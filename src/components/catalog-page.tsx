import { Catalog, CatalogItem } from "@/components/catalog";
import { getCurrentUser } from "@/utils/authentication";
import { CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

// Shared body of /forms and /tests.
export async function CatalogPage({
  kind,
  items,
  saved,
}: {
  kind: "form" | "test";
  items: CatalogItem[];
  saved: boolean;
}) {
  const t = await getTranslations("respondent");
  const user = await getCurrentUser();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:py-10">
      {saved && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="font-medium">{t("savedTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("savedText")}</p>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1">
        {user && <p className="text-sm text-muted-foreground">{t("greeting", { name: user.name })}</p>}
        <h1 className="text-2xl font-bold sm:text-3xl">{t(kind === "form" ? "forms" : "tests")}</h1>
        <p className="max-w-2xl text-muted-foreground">{t(kind === "form" ? "formsIntro" : "testsIntro")}</p>
      </div>
      <Catalog kind={kind} items={items} hrefPrefix={kind === "form" ? "/forms/" : "/tests/"} />
    </div>
  );
}
