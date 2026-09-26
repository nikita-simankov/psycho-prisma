import { findAllForms } from "@/actions/form/find-all-forms-action";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { Stat } from "@/components/ui/stat";
import { findAllTeams } from "@/actions/team/team-actions";
import { getContext } from "@/utils/authentication";
import { can } from "@/utils/roles";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { organizationBase } from "@/utils/organization-path";

export async function DashboardStatistics() {
  const base = await organizationBase();
  const t = await getTranslations("dashboard.stats");
  const [users, forms, tests, teams, context] = await Promise.all([
    findAllUsers(),
    findAllForms(),
    findAllTests(),
    findAllTeams(),
    getContext(),
  ]);
  const respondents = users.filter((user) => user.role === "member");
  const flagged = users.filter((user) => user.flag).length;
  const sensitive = context?.membership ? can(context.membership.role, "viewSensitive") : false;

  const cards = [
    { title: t("people"), hint: t("peopleHint"), value: respondents.length, href: `${base}/people` },
    { title: t("forms"), hint: t("formsHint"), value: forms.length, href: `${base}/forms` },
    { title: t("tests"), hint: t("testsHint"), value: tests.length, href: `${base}/tests` },
    sensitive
      ? {
          title: t("atRisk"),
          hint: t("atRiskHint"),
          value: flagged,
          href: `${base}/people/follow-up`,
          warn: flagged > 0,
        }
      : { title: t("teams"), hint: t("teamsHint"), value: teams.length, href: `${base}/people/teams` },
  ];

  return (
    <div className="grid grid-cols-2 border-y xl:grid-cols-4">
      {cards.map(({ title, hint, value, href, warn }, index) => (
        <Link
          key={title}
          href={href}
          className={
            "px-1 py-5 transition-colors hover:bg-card sm:px-5 " +
            (index % 2 === 1 ? "border-l " : "") +
            (index >= 2 ? "border-t xl:border-t-0 " : "") +
            (index === 2 ? "xl:border-l" : "")
          }
        >
          <Stat label={title} value={value} hint={hint} tone={warn ? "attention" : "neutral"} />
        </Link>
      ))}
    </div>
  );
}
