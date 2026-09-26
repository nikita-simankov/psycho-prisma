import { findAllForms } from "@/actions/form/find-all-forms-action";
import { findOpenInvitations } from "@/actions/invitation/invitation-actions";
import { findAllTeams } from "@/actions/team/team-actions";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { PageHeader } from "@/components/page-header";
import { ensureMember } from "@/utils/authentication";
import { organizationBase } from "@/utils/organization-path";
import { can } from "@/utils/roles";
import { formatFullName } from "@/utils/user";
import { getTranslations } from "next-intl/server";
import { RoundForm } from "./round-form";

export async function generateMetadata() {
  const t = await getTranslations("rounds.form");
  return { title: t("title") };
}

export default async function NewRoundPage() {
  const { membership } = await ensureMember("manageRounds");
  const base = await organizationBase();
  const t = await getTranslations("rounds");
  const form = await getTranslations("rounds.form");
  const sensitive = can(membership.role, "viewSensitive");
  const [tests, forms, users, teams, invitations] = await Promise.all([
    findAllTests(),
    findAllForms(),
    findAllUsers(),
    findAllTeams(),
    // Only people who can see invitations can pick invitees.
    can(membership.role, "manageMembers") ? findOpenInvitations() : Promise.resolve([]),
  ]);
  const now = new Date();

  return (
    <>
      <PageHeader title={form("title")} description={form("description")} back={{ href: `${base}/rounds`, label: t("title") }} />
      <RoundForm
        canSendSensitive={sensitive}
        instruments={[
          ...forms
            .filter((item) => !item.adminOnly)
            .map((item) => ({ kind: "form" as const, id: item.id, name: item.name, minutes: item.ttc, sensitive: false, retestDays: 0 })),
          ...tests
            .filter((item) => sensitive || !item.sensitive)
            .map((item) => ({
              kind: "test" as const,
              id: item.id,
              name: item.name,
              minutes: item.ttc,
              sensitive: item.sensitive,
              retestDays: item.retestDays,
            })),
        ]}
        people={users
          .filter((user) => user.role !== "candidate")
          .map((user) => ({ id: user.id, name: formatFullName(user), teamId: user.teamId, email: user.email ?? "" }))}
        teams={teams.map((team) => ({ id: team.id, name: team.name }))}
        invitees={invitations
          .filter((invitation) => invitation.role === "member" && invitation.expiresAt > now)
          .map((invitation) => ({
            id: invitation.id,
            email: invitation.email,
            name: [invitation.name, invitation.lastName].filter(Boolean).join(" "),
            teamId: invitation.teamId,
          }))}
      />
    </>
  );
}
