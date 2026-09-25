import { logout } from "@/actions/auth/logout.action";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { RespondentNav } from "@/components/respondent-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { getCurrentUser } from "@/utils/authentication";
import { LayoutDashboard, LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

// Top bar for people taking questionnaires and tests.
export async function RespondentHeader() {
  const common = await getTranslations("common");
  const nav = await getTranslations("dashboard.nav");
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4 sm:gap-4">
        <Link href="/forms" className="shrink-0">
          <Logo withText className="[&>span]:hidden sm:[&>span]:inline" />
        </Link>
        <RespondentNav />
        <div className="ml-auto flex items-center">
          {user?.role === "admin" && (
            <Button variant="ghost" size="icon" asChild title={nav("home")}>
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                <span className="sr-only">{nav("home")}</span>
              </Link>
            </Button>
          )}
          <LocaleSwitcher />
          <ThemeToggle />
          <form action={logout}>
            <Button variant="ghost" size="icon" title={common("signOut")}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only">{common("signOut")}</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
