"use client";

import { switchOrganization } from "@/actions/organization/organization-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Option = { id: string; name: string; role: string };

// Shows the organization being worked in and switches to another one.
export function OrganizationSwitcher({ current, options }: { current: Option; options: Option[] }) {
  const t = useTranslations("organizations");
  const roles = useTranslations("roles");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const select = (id: string) =>
    startTransition(async () => {
      await switchOrganization(id);
      router.push("/dashboard");
      router.refresh();
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center gap-3 rounded-lg border bg-background px-3 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        disabled={pending}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary font-heading text-sm font-bold text-primary-foreground">
          {current.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{current.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{roles(current.role)}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="sr-only">{t("switch")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">{t("yours")}</DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuItem key={option.id} onSelect={() => option.id !== current.id && select(option.id)}>
            <span className="min-w-0 flex-1">
              <span className="block truncate">{option.name}</span>
              <span className="block text-xs text-muted-foreground">{roles(option.role)}</span>
            </span>
            {option.id === current.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/organizations/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("create")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
