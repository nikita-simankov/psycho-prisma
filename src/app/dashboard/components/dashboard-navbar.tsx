import { logout } from "@/actions/auth/logout.action";
import { findAllForms } from "@/actions/form/find-all-forms-action";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Pyramid } from "lucide-react";
import Link from "next/link";
import React from "react";
import DashboardSearch from "./dashboard-search";
import Logo from "@/components/ui/logo";

const navigationLinks = [
  {
    href: "/dashboard",
    text: "Главная",
  },
  {
    href: "/dashboard/forms",
    text: "Анкетирование",
  },
  {
    href: "/dashboard/tests",
    text: "Тестовые методики",
  },
  {
    href: "/dashboard/users",
    text: "Личный состав",
  },
  {
    href: "/dashboard/summary",
    text: "Характеристика",
  },
  {
    href: "/dashboard/users/groups",
    text: "Группировка",
  },
  {
    href: "/dashboard/archive",
    text: "Архив",
  },
];

export const DashboardNavbar: React.FC = async () => {
  const users = await findAllUsers();
  const tests = await findAllTests();
  const forms = await findAllForms();

  return (
    <header className="print:hidden w-full h-16 px-6 py-2 border-b flex flex-row items-center justify-between">
      <div className="flex flex-row items-center gap-2">
        <Logo withText />
        <nav className="ml-6 flex flex-row items-center gap-4">
          {navigationLinks.map((link) => (
            <Link
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-black dark:hover:text-white"
            >
              {link.text}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex flex-row items-center gap-4">
        <DashboardSearch users={users} tests={tests} forms={forms} />
        <ThemeToggle />
        {/* @ts-ignore */}
        <form action={logout}>
          <Button variant="destructive">Выйти</Button>
        </form>
      </div>
    </header>
  );
};
