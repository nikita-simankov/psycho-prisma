import { findAllForms } from "@/actions/form/find-all-forms-action";
import { findAllTeams } from "@/actions/team/team-actions";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { VerifyEmailBanner } from "@/components/auth/verify-email-banner";
import { SampleBanner } from "@/components/onboarding/sample-banner";
import { prisma } from "@/utils/database";
import { BillingBanner } from "@/components/billing/billing-banner";
import { BreadcrumbProvider } from "@/components/breadcrumbs";
import { OrganizationProvider } from "@/components/organization-provider";
import { SIDEBAR_COOKIE_NAME, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TimeZoneSync } from "@/components/time-zone-sync";
import { ensureMember } from "@/utils/authentication";
import { cookies } from "next/headers";
import React from "react";
import { AppHeader } from "./components/app-header";
import { AppSidebar } from "./components/app-sidebar";

// Staff workspace for one organization, addressed by its slug (/acme/...).
export default async function OrganizationLayout({ children }: { children: React.ReactNode }) {
  const context = await ensureMember("viewDashboard");
  const { organization, membership, memberships, user } = context;
  const [users, tests, forms, teams, settings] = await Promise.all([
    findAllUsers(),
    findAllTests(),
    findAllForms(),
    findAllTeams(),
    prisma.organization.findUniqueOrThrow({ where: { id: organization.id }, select: { isSample: true } }),
  ]);

  return (
    <OrganizationProvider value={{ slug: organization.slug, name: organization.name, role: membership.role }}>
      <BreadcrumbProvider>
        <TimeZoneSync />
        <SidebarProvider defaultOpen={(await cookies()).get(SIDEBAR_COOKIE_NAME)?.value !== "false"}>
          <AppSidebar
            user={user}
            organizations={memberships.map((m) => ({ slug: m.organization.slug, name: m.organization.name, role: m.role }))}
          />
          <SidebarInset>
            <AppHeader
              search={{
                users: users.map((u) => ({
                  id: u.id,
                  name: u.name,
                  middleName: u.middleName,
                  lastName: u.lastName,
                  department: u.department,
                  position: u.position,
                })),
                tests: tests.map((test) => ({ id: test.id, name: test.name })),
                forms: forms.map((form) => ({ id: form.id, name: form.name })),
                teams: teams.map((team) => ({ id: team.id, name: team.name })),
              }}
            />
            {settings.isSample && <SampleBanner canDelete={membership.role === "owner"} />}
            {!user.emailVerifiedAt && user.email && <VerifyEmailBanner email={user.email} />}
            {!settings.isSample && <BillingBanner organizationId={organization.id} role={membership.role} base={`/${organization.slug}`} />}
            <div id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 outline-hidden sm:px-6 lg:px-8 print:p-0">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </BreadcrumbProvider>
    </OrganizationProvider>
  );
}
