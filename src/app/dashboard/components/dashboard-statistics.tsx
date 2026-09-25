import { findAllForms } from "@/actions/form/find-all-forms-action";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RISK_GROUPS } from "@/utils/groups";
import { FlaskConical, NotepadText, TriangleAlert, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function DashboardStatistics() {
  const t = await getTranslations("dashboard.stats");
  const common = await getTranslations("common");
  const [users, forms, tests] = await Promise.all([
    findAllUsers(),
    findAllForms(),
    findAllTests(),
  ]);
  const atRisk = users.filter((user) =>
    (RISK_GROUPS as readonly string[]).includes(user.group)
  ).length;

  const cards = [
    { icon: Users, title: t("people"), value: common("people", { count: users.length }) },
    { icon: NotepadText, title: t("forms"), value: forms.length },
    { icon: FlaskConical, title: t("tests"), value: tests.length },
    { icon: TriangleAlert, title: t("atRisk"), value: common("people", { count: atRisk }) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map(({ icon: Icon, title, value }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center gap-2">
            <Icon />
            <CardTitle className="text-xl mb-2">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
