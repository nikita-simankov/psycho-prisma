import { LogoMark } from "@/components/ui/logo";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function SiteFooter() {
  const t = await getTranslations("landing.footer");
  const common = await getTranslations("common");

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <LogoMark className="h-6 w-6" />
          <span>{t("tagline")}</span>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
          <span>{t("disclaimer")}</span>
          <Link href="/privacy" className="font-medium text-foreground hover:text-primary">
            {common("privacy")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
