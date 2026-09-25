import { logout } from "@/actions/auth/logout.action";
import { findAllForms } from "@/actions/form/find-all-forms-action";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import UserAvatar from "@/components/ui/user-avatar";
import type { Context } from "@/utils/authentication";
import { formatFullName } from "@/utils/user";
import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { DashboardNav } from "./dashboard-nav";
import DashboardSearch from "./dashboard-search";
import { MobileNav } from "./mobile-nav";
import { OrganizationSwitcher } from "./organization-switcher";

function Switcher({ context }: { context: Context }) {
  return (
    <OrganizationSwitcher
      current={{ id: context.organization.id, name: context.organization.name, role: context.membership.role }}
      options={context.memberships.map((m) => ({ id: m.organizationId, name: m.organization.name, role: m.role }))}
    />
  );
}

// Left rail on large screens; hidden on small screens, where MobileNav opens the same links.
export async function DashboardSidebar({ context }: { context: Context }) {
  const common = await getTranslations("common");
  const { user } = context;

  return (
    <aside className="print:hidden hidden lg:flex sticky top-0 h-dvh flex-col gap-5 border-r bg-card px-4 py-5">
      <Link href="/dashboard" className="px-2">
        <Logo withText />
      </Link>
      <Switcher context={context} />
      <DashboardNav role={context.membership.role} />
      <div className="mt-auto flex items-center gap-3 rounded-lg border bg-background p-2">
        <UserAvatar user={user} className="h-9 w-9" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{formatFullName(user)}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email ?? user.phoneNumber}</p>
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

export async function DashboardTopbar({ context }: { context: Context }) {
  const [users, tests, forms] = await Promise.all([findAllUsers(), findAllTests(), findAllForms()]);
  const common = await getTranslations("common");

  return (
    <header className="print:hidden sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-10">
      <MobileNav role={context.membership.role} switcher={<Switcher context={context} />} />
      <Link href="/dashboard" className="lg:hidden">
        <Logo />
      </Link>
      <div className="flex flex-1 justify-end lg:justify-start">
        <DashboardSearch
          role={context.membership.role}
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
