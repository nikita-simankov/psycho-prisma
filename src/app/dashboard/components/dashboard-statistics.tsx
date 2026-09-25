import { findAllForms } from "@/actions/form/find-all-forms-action";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { Card } from "@/components/ui/card";
import { RISK_GROUPS } from "@/utils/groups";
import { cn } from "@/utils/utils";
import { FlaskConical, NotepadText, TriangleAlert, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function DashboardStatistics() {
  const t = await getTranslations("dashboard.stats");
  const [users, forms, tests] = await Promise.all([findAllUsers(), findAllForms(), findAllTests()]);
  const respondents = users.filter((user) => user.role !== "admin");
  const atRisk = respondents.filter((user) =>
    (RISK_GROUPS as readonly string[]).includes(user.group)
  ).length;

  const cards = [
    { icon: Users, title: t("people"), hint: t("peopleHint"), value: respondents.length, href: "/dashboard/users" },
    { icon: NotepadText, title: t("forms"), hint: t("formsHint"), value: forms.length, href: "/dashboard/forms" },
    { icon: FlaskConical, title: t("tests"), hint: t("testsHint"), value: tests.length, href: "/dashboard/tests" },
    {
      icon: TriangleAlert,
      title: t("atRisk"),
      hint: t("atRiskHint"),
      value: atRisk,
      href: "/dashboard/users/groups",
      warn: atRisk > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {cards.map(({ icon: Icon, title, hint, value, href, warn }) => (
        <Link key={title} href={href} className="group">
          <Card className="h-full p-4 sm:p-5 transition-colors group-hover:border-primary/40">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className="font-heading text-3xl font-bold tabular-nums">{value}</p>
              </div>
              <span
                className={cn(
                  "hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent sm:flex text-accent-foreground",
                  warn && "bg-warning/15 text-warning"
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
