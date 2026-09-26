"use client";

import { useOrganization } from "@/components/organization-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import UserAvatar from "@/components/ui/user-avatar";
import { UserMenu, type MenuUser } from "@/components/user-menu";
import { can } from "@/utils/roles";
import { formatFullName } from "@/utils/user";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION, visibleGroups } from "./navigation";

type OrganizationOption = { slug: string; name: string; role: string };

function OrganizationMark({ name }: { name: string }) {
  return (
    <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md bg-foreground font-heading text-sm font-medium text-background">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function OrganizationSwitcher({ organizations }: { organizations: OrganizationOption[] }) {
  const t = useTranslations("organizations");
  const roles = useTranslations("roles");
  const current = useOrganization();
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent" aria-label={t("switch")}>
              <OrganizationMark name={current.name} />
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">{current.name}</span>
                <span className="truncate text-xs text-muted-foreground">{roles(current.role)}</span>
              </span>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-60" align="start" side={isMobile ? "bottom" : "right"}>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">{t("yours")}</DropdownMenuLabel>
            {organizations.map((organization) => (
              <DropdownMenuItem key={organization.slug} asChild>
                <Link href={`/${organization.slug}`} className="gap-2">
                  <OrganizationMark name={organization.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{organization.name}</span>
                    <span className="block text-xs text-muted-foreground">{roles(organization.role)}</span>
                  </span>
                  {organization.slug === current.slug && <Check className="h-4 w-4 text-primary" />}
                </Link>
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
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// The most specific section containing the current path is the active one; returns its link.
function activePath(pathname: string, base: string) {
  const within = (href: string) => pathname === href || (href !== base && pathname.startsWith(href + "/"));
  return NAVIGATION.flatMap((item) =>
    [item.path, ...(item.alsoMatches ?? [])].map((path) => ({ href: base + item.path, match: base + path })),
  )
    .filter(({ match }) => within(match))
    .sort((a, b) => b.match.length - a.match.length)[0]?.href;
}

export function AppSidebar({ organizations, user }: { organizations: OrganizationOption[]; user: MenuUser }) {
  const t = useTranslations("dashboard");
  const { slug, role } = useOrganization();
  const { isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const base = `/${slug}`;
  const active = activePath(pathname, base);

  return (
    <Sidebar variant="inset" collapsible="icon" mobileTitle={t("menu")}>
      <SidebarHeader>
        <OrganizationSwitcher organizations={organizations} />
      </SidebarHeader>
      <SidebarContent>
        {visibleGroups((permission) => can(role, permission)).map((group) => (
          <SidebarGroup key={group.key}>
            {group.key !== "overview" && <SidebarGroupLabel>{t(`navGroups.${group.key}`)}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ key, path, icon: Icon }) => {
                  const href = base + path;
                  return (
                    <SidebarMenuItem key={key}>
                      <SidebarMenuButton asChild isActive={href === active} tooltip={t(`nav.${key}`)}>
                        <Link
                          href={href}
                          aria-current={href === active ? "page" : undefined}
                          onClick={() => isMobile && setOpenMobile(false)}
                        >
                          <Icon />
                          <span>{t(`nav.${key}`)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu
              user={user}
              side={isMobile ? "bottom" : "right"}
              align="end"
              trigger={
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                  <UserAvatar user={user} className="h-8 w-8 rounded-lg" />
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-medium">{formatFullName(user)}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email ?? user.phoneNumber}</span>
                  </span>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail label={t("toggleSidebar")} />
    </Sidebar>
  );
}
