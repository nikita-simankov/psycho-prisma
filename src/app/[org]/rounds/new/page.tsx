import { findAllForms } from "@/actions/form/find-all-forms-action";
import { findOpenInvitations } from "@/actions/invitation/invitation-actions";
import { findAllTeams } from "@/actions/team/team-actions";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { PageHeader } from "@/components/page-header";
import { ensureMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { organizationBase } from "@/utils/organization-path";
import { can } from "@/utils/roles";
import { ROUND_TEMPLATES } from "@/utils/round-templates";
import { formatFullName } from "@/utils/user";
import { getTranslations } from "next-intl/server";
import { EMPTY_ROUND, type RoundDraftData } from "@/utils/round-draft";
import { RoundForm } from "./round-form";

export async function generateMetadata() {
  const t = await getTranslations("rounds.form");
  return { title: t("title") };
}

type Search = { draft?: string; test?: string; form?: string; person?: string; team?: string };

// The composer. It opens a saved draft, or starts prefilled from a test, questionnaire, person or
// team ("Send in a round" elsewhere in the app).
export default async function NewRoundPage(props: { searchParams: Promise<Search> }) {
  const search = await props.searchParams;
  const { membership, organization } = await ensureMember("manageRounds");
  const base = await organizationBase();
  const t = await getTranslations("rounds");
  const form = await getTranslations("rounds.form");
  const sensitive = can(membership.role, "viewSensitive");
  const [tests, forms, users, teams, invitations, draft] = await Promise.all([
    findAllTests(),
    findAllForms(),
    findAllUsers(),
    findAllTeams(),
    // Only people who can see invitations can pick invitees.
    can(membership.role, "manageMembers") ? findOpenInvitations() : Promise.resolve([]),
    search.draft ? prisma.roundDraft.findFirst({ where: { id: search.draft, organizationId: organization.id } }) : null,
  ]);
  const now = new Date();

  const instruments = [
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
  ];
  const known = new Set(instruments.map((item) => `${item.kind}:${item.id}`));

  let initial: Partial<RoundDraftData> = {};
  if (draft) {
    try {
      initial = { ...EMPTY_ROUND, ...JSON.parse(draft.data) };
    } catch {
      initial = {};
    }
  } else {
    const item = search.test ? `test:${search.test}` : search.form ? `form:${search.form}` : null;
    initial = {
      items: item && known.has(item) ? [item] : [],
      userIds: search.person && users.some((user) => user.id === search.person) ? [search.person] : [],
      teamIds: search.team && teams.some((team) => team.id === search.team) ? [search.team] : [],
    };
  }

  const templates = ROUND_TEMPLATES.map((template) => ({
    key: template.key,
    purpose: template.purpose,
    repeat: template.repeat ?? "",
    dueDays: template.dueDays,
    items: template.tests.map((id) => `test:${id}`).filter((entry) => known.has(entry)),
  })).filter((template) => template.items.length > 0);

  return (
    <>
      <PageHeader title={form("title")} description={form("description")} back={{ href: `${base}/rounds`, label: t("title") }} />
      <RoundForm
        canSendSensitive={sensitive}
        instruments={instruments}
        templates={templates}
        initial={initial}
        draftId={draft?.id ?? null}
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
