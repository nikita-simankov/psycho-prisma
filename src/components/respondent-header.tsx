import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { OrganizationMark } from "@/components/organization-mark";
import UserAvatar from "@/components/ui/user-avatar";
import { UserMenu } from "@/components/user-menu";
import { getContext } from "@/utils/authentication";
import { can } from "@/utils/roles";
import { LayoutDashboard } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

// Top bar for people taking questionnaires and tests. It carries the organization, not the product:
// respondents are there for their employer, so no product chrome or billing appears in this area.
export async function RespondentHeader() {
  const nav = await getTranslations("dashboard.nav");
  const menu = await getTranslations("account.menu");
  const context = await getContext();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4 sm:gap-4">
        {context?.membership ? (
          <Link href="/assessments" className="flex min-w-0 items-center gap-2.5">
            <OrganizationMark name={context.organization.name} className="size-7" />
            <span className="truncate font-medium">{context.organization.name}</span>
          </Link>
        ) : (
          <Link href="/assessments" className="shrink-0">
            <Logo withText />
          </Link>
        )}
        <div className="ml-auto flex items-center gap-1">
          {context?.membership && can(context.linkSessionRole ?? context.membership.role, "viewDashboard") && (
            <Button variant="ghost" size="icon" asChild title={nav("home")}>
              <Link href={`/${context.organization.slug}`}>
                <LayoutDashboard className="h-4 w-4" />
                <span className="sr-only">{nav("home")}</span>
              </Link>
            </Button>
          )}
          {context && (
            <UserMenu
              user={context.user}
              trigger={
                <button
                  type="button"
                  className="rounded-full focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={menu("open")}
                >
                  <UserAvatar user={context.user} className="h-8 w-8" />
                </button>
              }
            />
          )}
        </div>
      </div>
    </header>
  );
}
