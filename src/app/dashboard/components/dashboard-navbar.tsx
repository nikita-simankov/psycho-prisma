import { logout } from "@/actions/auth/logout.action";
import { findAllForms } from "@/actions/form/find-all-forms-action";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import UserAvatar from "@/components/ui/user-avatar";
import { formatFullName, PublicUser } from "@/utils/user";
import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { DashboardNav } from "./dashboard-nav";
import DashboardSearch from "./dashboard-search";
import { MobileNav } from "./mobile-nav";

// Left rail on large screens; hidden on small screens, where MobileNav opens the same links.
export async function DashboardSidebar({ user }: { user: PublicUser }) {
  const common = await getTranslations("common");
  const roles = await getTranslations("roles");

  return (
    <aside className="print:hidden hidden lg:flex sticky top-0 h-dvh flex-col gap-8 border-r bg-card px-4 py-5">
      <Link href="/dashboard" className="px-2">
        <Logo withText />
      </Link>
      <DashboardNav />
      <div className="mt-auto flex items-center gap-3 rounded-lg border bg-background p-2">
        <UserAvatar user={user} className="h-9 w-9" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{formatFullName(user)}</p>
          <p className="text-xs text-muted-foreground">{roles(user.role === "admin" ? "admin" : "user")}</p>
        </div>
        <form action={logout}>
          <Button variant="ghost" size="icon" title={common("signOut")}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only">{common("signOut")}</span>
          </Button>
        </form>
      </div>
    </aside>
  );
}

export async function DashboardTopbar() {
  const [users, tests, forms] = await Promise.all([findAllUsers(), findAllTests(), findAllForms()]);
  const common = await getTranslations("common");

  return (
    <header className="print:hidden sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-10">
      <MobileNav />
      <Link href="/dashboard" className="lg:hidden">
        <Logo />
      </Link>
      <div className="flex flex-1 justify-end lg:justify-start">
        <DashboardSearch
          users={users.map((user) => ({
            id: user.id,
            name: user.name,
            middleName: user.middleName,
            lastName: user.lastName,
            department: user.department,
            position: user.position,
          }))}
          tests={tests.map((test) => ({ id: test.id, name: test.name }))}
          forms={forms.map((form) => ({ id: form.id, name: form.name }))}
        />
      </div>
      <LocaleSwitcher />
      <ThemeToggle />
      <form action={logout} className="lg:hidden">
        <Button variant="ghost" size="icon" title={common("signOut")}>
          <LogOut className="h-4 w-4" />
          <span className="sr-only">{common("signOut")}</span>
        </Button>
      </form>
    </header>
  );
}
