import { logout } from "@/actions/auth/logout.action";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

// Top bar for people taking questionnaires and tests.
export async function RespondentHeader() {
  const t = await getTranslations("respondent");
  const common = await getTranslations("common");

  return (
    <header className="w-full h-16 px-6 py-2 border-b flex flex-row items-center justify-between">
      <div className="flex flex-row items-center gap-2">
        <Logo withText />
        <nav className="ml-6 flex flex-row items-center gap-4">
          <Link
            href="/forms"
            className="text-sm text-muted-foreground font-medium hover:text-foreground transition-colors"
          >
            {t("forms")}
          </Link>
          <Link
            href="/tests"
            className="text-sm text-muted-foreground font-medium hover:text-foreground transition-colors"
          >
            {t("tests")}
          </Link>
        </nav>
      </div>
      <div className="flex flex-row items-center gap-2">
        <LocaleSwitcher />
        <ThemeToggle />
        <form action={logout}>
          <Button variant="destructive">{common("signOut")}</Button>
        </form>
      </div>
    </header>
  );
}
