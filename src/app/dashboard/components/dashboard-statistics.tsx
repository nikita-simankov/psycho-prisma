import { findAllForms } from "@/actions/form/find-all-forms-action";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, NotepadText, TriangleAlert, Users } from "lucide-react";

export const DashboardStatistics: React.FC = async () => {
  const users = await findAllUsers();
  const forms = await findAllForms();
  const tests = await findAllTests();

  return (
    <div className="grid grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Users />
          <CardTitle className="text-xl mb-2">Пользователи</CardTitle>
        </CardHeader>
        <CardContent>
          <h1 className="text-xl font-bold">{users.length} чел.</h1>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <NotepadText />
          <CardTitle className="text-xl mb-2">Количество анкет</CardTitle>
        </CardHeader>
        <CardContent>
          <h1 className="text-xl font-bold">{forms.length} шт.</h1>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <FlaskConical />
          <CardTitle className="text-xl mb-2">Количество методик</CardTitle>
        </CardHeader>
        <CardContent>
          <h1 className="text-xl font-bold">{tests.length} шт.</h1>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <TriangleAlert />
          <CardTitle className="text-xl mb-2">Группа риска</CardTitle>
        </CardHeader>
        <CardContent>
          <h1 className="text-xl font-bold">
            {users.filter((user) => user.group === "Группа риска").length} чел.
          </h1>
        </CardContent>
      </Card>
    </div>
  );
};
