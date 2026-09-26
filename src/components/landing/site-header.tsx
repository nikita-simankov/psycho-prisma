import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { Menu } from "lucide-react";
import { cn } from "@/utils/utils";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export const SITE_LINKS = [
  { key: "product", href: "/product" },
  { key: "instruments", href: "/instruments" },
  { key: "pricing", href: "/pricing" },
  { key: "security", href: "/security" },
] as const;

// Header for the public site: landing, product, pricing, instruments, security and legal pages.
export async function SiteHeader({ wide }: { wide?: boolean } = {}) {
  const t = await getTranslations("site");
  const common = await getTranslations("common");

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-sm">
      <div className={cn("mx-auto flex h-16 items-center justify-between gap-4 px-4", wide ? "max-w-[88rem] sm:px-8" : "max-w-6xl")}>
        <div className="flex items-center gap-8">
          <Link href="/" aria-label={common("appName")}>
            <Logo withText />
          </Link>
          <nav aria-label={t("nav.label")} className="hidden lg:block">
            <ul className="flex items-center gap-6 text-sm">
              {SITE_LINKS.map(({ key, href }) => (
                <li key={key}>
                  <Link href={href} className="text-muted-foreground transition-colors hover:text-foreground">
                    {t(`nav.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
          <Button size="sm" variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/auth/sign-in">{common("signIn")}</Link>
          </Button>
          <Button size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/auth/sign-up">{t("trial")}</Link>
          </Button>
          <details className="group relative lg:hidden">
            <summary className="flex size-9 cursor-pointer list-none items-center justify-center rounded-md hover:bg-secondary [&::-webkit-details-marker]:hidden">
              <Menu className="size-4" aria-hidden />
              <span className="sr-only">{t("nav.menu")}</span>
            </summary>
            <nav
              aria-label={t("nav.label")}
              className="absolute right-0 top-11 w-56 rounded-md border bg-popover p-2 shadow-overlay"
            >
              <ul className="flex flex-col text-sm">
                {SITE_LINKS.map(({ key, href }) => (
                  <li key={key}>
                    <Link href={href} className="block rounded-sm px-3 py-2 hover:bg-secondary">
                      {t(`nav.${key}`)}
                    </Link>
                  </li>
                ))}
                <li className="mt-1 border-t pt-1">
                  <Link href="/auth/sign-in" className="block rounded-sm px-3 py-2 hover:bg-secondary">
                    {common("signIn")}
                  </Link>
                </li>
                <li>
                  <Link href="/auth/sign-up" className="block rounded-sm px-3 py-2 font-medium text-primary hover:bg-secondary">
                    {t("trial")}
                  </Link>
                </li>
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
