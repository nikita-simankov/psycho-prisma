"use client";

import { logout } from "@/actions/auth/logout.action";
import { setLocale } from "@/actions/locale/set-locale-action";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/ui/user-avatar";
import { LOCALES } from "@/i18n/config";
import { formatFullName, type PublicUser } from "@/utils/user";
import { Languages, LogOut, Palette, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export type MenuUser = Pick<PublicUser, "name" | "lastName" | "middleName" | "imageURL" | "email" | "phoneNumber">;

// Account, language, theme and sign-out, behind the person's avatar.
export function UserMenu({
  user,
  trigger,
  side = "bottom",
  align = "end",
}: {
  user: MenuUser;
  trigger: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "end";
}) {
  const t = useTranslations("account.menu");
  const common = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align} className="w-60">
        <DropdownMenuLabel className="flex items-center gap-2 font-normal">
          <UserAvatar user={user} className="h-8 w-8" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{formatFullName(user)}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.email ?? user.phoneNumber}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserRound className="mr-2 h-4 w-4" />
            {t("account")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages className="mr-2 h-4 w-4" />
            {common("language")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={locale}
              onValueChange={(value) =>
                startTransition(async () => {
                  await setLocale(value);
                  router.refresh();
                })
              }
            >
              {LOCALES.map((option) => (
                <DropdownMenuRadioItem key={option} value={option}>
                  {common(`locales.${option}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 h-4 w-4" />
            {t("theme")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              {(["light", "dark", "system"] as const).map((option) => (
                <DropdownMenuRadioItem key={option} value={option}>
                  {common(`theme.${option}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => startTransition(() => logout())}>
          <LogOut className="mr-2 h-4 w-4" />
          {common("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
