"use client";

import { Kbd } from "@/components/ui/kbd";
import { useOrganization } from "@/components/organization-provider";
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
import { CircleUser, FlaskConical, Layers, Moon, NotepadText, Plus, Search, Sun, UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { visibleGroups } from "./navigation";

type SearchItem = { id: string; name: string };

export type SearchData = {
  users: Pick<Member, "id" | "name" | "middleName" | "lastName" | "department" | "position">[];
  forms: SearchItem[];
  tests: SearchItem[];
  teams: SearchItem[];
};

// Command menu (Ctrl K) for jumping to a section, a person, a team or an instrument.
export default function DashboardSearch({ users, forms, tests, teams }: Readonly<SearchData>) {
  const t = useTranslations("dashboard.search");
  const nav = useTranslations("dashboard.nav");
  const { slug, role } = useOrganization();
  const base = `/${slug}`;
  const router = useRouter();
  const [isOpen, setOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

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

  const sections = visibleGroups((permission) => can(role, permission)).flatMap((group) => group.items);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center gap-2 rounded-lg border bg-card text-sm text-muted-foreground shadow-xs transition-colors hover:border-primary/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring sm:w-64 sm:justify-start sm:px-3"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="sr-only sm:not-sr-only sm:flex-1 sm:truncate sm:text-left">{t("placeholder")}</span>
        <Kbd className="hidden sm:inline-flex">Ctrl K</Kbd>
      </button>
      <CommandDialog open={isOpen} onOpenChange={setOpen}>
        <CommandInput placeholder={t("dialogPlaceholder")} />
        <CommandList>
          <CommandEmpty>{t("empty")}</CommandEmpty>
          <CommandGroup heading={t("navigation")}>
            {sections.map(({ key, path, icon: Icon }) => (
              <CommandItem key={key} value={`section ${nav(key)}`} onSelect={() => go(base + path)} className="gap-2">
                <Icon className="h-4 w-4" />
                <span>{nav(key)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading={t("actions")}>
            {can(role, "manageRounds") && (
              <CommandItem value={`action ${t("newRound")}`} onSelect={() => go(`${base}/rounds/new`)} className="gap-2">
                <Plus className="size-4" />
                <span>{t("newRound")}</span>
              </CommandItem>
            )}
            <CommandItem value={`action ${t("account")}`} onSelect={() => go("/account")} className="gap-2">
              <CircleUser className="size-4" />
              <span>{t("account")}</span>
            </CommandItem>
            <CommandItem
              value={`action theme ${resolvedTheme === "dark" ? t("lightTheme") : t("darkTheme")}`}
              onSelect={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
                setOpen(false);
              }}
              className="gap-2"
            >
              {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              <span>{resolvedTheme === "dark" ? t("lightTheme") : t("darkTheme")}</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading={nav("people")}>
            {users.map((user) => (
              <CommandItem
                key={user.id}
                value={`person ${formatFullName(user)} ${formatWorkInfo(user)} ${user.id}`}
                onSelect={() => go(`${base}/people/${user.id}`)}
                className="justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  {formatFullName(user)}
                </span>
                <span className="truncate text-xs text-muted-foreground">{formatWorkInfo(user)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          {teams.length > 0 && (
            <CommandGroup heading={nav("teams")}>
              {teams.map((team) => (
                <CommandItem key={team.id} value={`team ${team.name} ${team.id}`} onSelect={() => go(`${base}/people/teams/${team.id}`)} className="gap-2">
                  <Layers className="h-4 w-4" />
                  {team.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          <CommandGroup heading={nav("forms")}>
            {forms.map((form) => (
              <CommandItem key={form.id} value={`form ${form.name} ${form.id}`} onSelect={() => go(`${base}/forms/${form.id}/results`)} className="gap-2">
                <NotepadText className="h-4 w-4" />
                {form.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading={nav("tests")}>
            {tests.map((test) => (
              <CommandItem key={test.id} value={`test ${test.name} ${test.id}`} onSelect={() => go(`${base}/tests/${test.id}/results`)} className="gap-2">
                <FlaskConical className="h-4 w-4" />
                {test.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
