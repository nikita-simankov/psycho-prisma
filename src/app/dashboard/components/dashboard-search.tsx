"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { can } from "@/utils/roles";
import { formatFullName, formatWorkInfo, type Member } from "@/utils/user";
import { FlaskConical, NotepadText, Search, UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DASHBOARD_NAVIGATION } from "./navigation";

type SearchUser = Pick<Member, "id" | "name" | "middleName" | "lastName" | "department" | "position">;
type SearchItem = { id: string; name: string };

interface Properties {
  role: string;
  users: SearchUser[];
  forms: SearchItem[];
  tests: SearchItem[];
}

export default function DashboardSearch({
  role,
  users,
  forms,
  tests,
}: Readonly<Properties>) {
  const t = useTranslations("dashboard.search");
  const nav = useTranslations("dashboard.nav");
  const router = useRouter();
  const [isOpen, setOpen] = useState<boolean>(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/40"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate text-left">{t("placeholder")}</span>
        <kbd className="hidden sm:inline rounded border bg-muted px-1.5 font-mono text-[10px]">Ctrl K</kbd>
      </button>
      <CommandDialog modal={true} open={isOpen} onOpenChange={setOpen}>
        <CommandInput placeholder={t("dialogPlaceholder")} />
        <CommandList>
          <CommandEmpty>{t("empty")}</CommandEmpty>
          <CommandGroup heading={t("navigation")}>
            {DASHBOARD_NAVIGATION.filter((link) => !("permission" in link) || can(role, link.permission)).map(({ key, href, icon: Icon }) => (
              <CommandItem
                key={key}
                onSelect={() => go(href)}
                className="flex flex-row items-center gap-2"
              >
                <Icon />
                <span className="text-xs font-medium">{nav(key)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading={nav("people")}>
            {users.map((user) => (
              <CommandItem
                key={user.id}
                onSelect={() => go("/dashboard/users/" + user.id)}
                className="flex flex-row items-center justify-between gap-2"
              >
                <div className="flex flex-row items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  <span className="text-xs font-medium">
                    {formatFullName(user)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatWorkInfo(user)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading={nav("forms")}>
            {forms.map((form) => (
              <CommandItem
                key={form.id}
                onSelect={() => go("/dashboard/forms/" + form.id + "/results")}
                className="flex flex-row items-center gap-2"
              >
                <NotepadText className="w-5 h-5" />
                <span className="text-xs font-medium">{form.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading={nav("tests")}>
            {tests.map((test) => (
              <CommandItem
                key={test.id}
                onSelect={() => go("/dashboard/tests/" + test.id + "/results")}
                className="flex flex-row items-center gap-2"
              >
                <FlaskConical className="w-5 h-5" />
                <span className="text-xs font-medium">{test.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
