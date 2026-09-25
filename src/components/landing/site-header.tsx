import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

// Header for public pages: landing and privacy notice.
export async function SiteHeader() {
  const common = await getTranslations("common");

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/">
          <Logo withText />
        </Link>
        <nav className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
          <Button size="sm" variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/auth/sign-in">{common("signIn")}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth/sign-up">{common("signUp")}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
