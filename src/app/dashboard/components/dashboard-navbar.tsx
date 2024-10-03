import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import clsx from "clsx";
import { Pyramid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { DashboardNavbarUserButton } from "./dashboard-navbar-user-button";
import { useSession } from "@/utils/authentication";
import { logout } from "@/actions/auth/logout.action";

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
];

export const DashboardNavbar: React.FC = async () => {
  const user = await useSession();

  return (
    <header className="print:hidden w-full h-16 px-6 py-2 border-b flex flex-row items-center justify-between">
      <div className="flex flex-row items-center gap-2">
        <Pyramid className="w-[2rem] h-[2rem]" />
        <nav className="flex flex-row items-center">
          {navigationLinks.map((link) => (
            <Link href={link.href}>
              <Button variant="link" className="dark:text-white">
                {link.text}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex flex-row items-center gap-4">
        <ThemeToggle />
        <form action={logout}>
          <Button variant="destructive">Выйти</Button>
        </form>
      </div>
    </header>
  );
};
