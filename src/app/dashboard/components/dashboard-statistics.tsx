import { findAllForms } from "@/actions/form/find-all-forms-action";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const DashboardStatistics: React.FC = async () => {
  const users = await findAllUsers();
  const forms = await findAllForms();
  const tests = await findAllTests();

  return (
    <div className="grid grid-cols-4 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Количество пользователей</CardTitle>
        </CardHeader>
        <CardContent>
          <h1 className="text-xl font-bold">{users.length}</h1>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Количество анкет</CardTitle>
        </CardHeader>
        <CardContent>
          <h1 className="text-xl font-bold">{forms.length}</h1>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Количество методик</CardTitle>
        </CardHeader>
        <CardContent>
          <h1 className="text-xl font-bold">{tests.length}</h1>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Группа риска</CardTitle>
        </CardHeader>
        <CardContent>
          <h1 className="text-xl font-bold">
            {users.filter((user) => user.group === "Группа риска").length}
          </h1>
        </CardContent>
      </Card>
    </div>
  );
};
