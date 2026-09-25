import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

// A page that doesn't exist or belongs to an organization the viewer isn't in.
export async function NotFoundMessage() {
  const t = await getTranslations("errors");

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <SearchX className="h-10 w-10 text-muted-foreground" aria-hidden />
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{t("notFoundTitle")}</h1>
        <p className="max-w-md text-sm text-muted-foreground">{t("notFoundText")}</p>
      </div>
      <Button asChild>
        <Link href="/">{t("goHome")}</Link>
      </Button>
    </div>
  );
}
