import { logout } from "@/actions/auth/logout.action";
import { findAllForms } from "@/actions/form/find-all-forms-action";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import DashboardSearch from "./dashboard-search";
import { DASHBOARD_NAVIGATION } from "./navigation";

export async function DashboardNavbar() {
  const [users, tests, forms] = await Promise.all([
    findAllUsers(),
    findAllTests(),
    findAllForms(),
  ]);
  const t = await getTranslations("dashboard.nav");
  const common = await getTranslations("common");

  return (
    <header className="print:hidden w-full h-16 px-6 py-2 border-b flex flex-row items-center justify-between">
      <div className="flex flex-row items-center gap-2">
        <Logo withText />
        <nav className="ml-6 flex flex-row items-center gap-4">
          {DASHBOARD_NAVIGATION.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex flex-row items-center gap-2">
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
        <LocaleSwitcher />
        <ThemeToggle />
        <form action={logout}>
          <Button variant="destructive">{common("signOut")}</Button>
        </form>
      </div>
    </header>
  );
}
