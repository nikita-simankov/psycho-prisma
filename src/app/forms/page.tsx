import { logout } from "@/actions/auth/logout.action";
import { findAllForms } from "@/actions/form/find-all-forms-action";
import { findFormById } from "@/actions/form/find-form-by-id-action";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pyramid } from "lucide-react";
import Link from "next/link";

export default async function Page() {
  4;
  const forms = await findAllForms();

  return (
    <div>
      <header className="w-full h-16 px-6 py-2 border-b flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-2">
          <Pyramid className="w-[2rem] h-[2rem]" />
          <nav className="flex flex-row items-center">
            <Link href="/forms">
              <Button variant="link" className="dark:text-white">
                Анкетирование
              </Button>
            </Link>
            <Link href="/tests">
              <Button variant="link" className="dark:text-white">
                Тестовые методики
              </Button>
            </Link>
          </nav>
        </div>
        <form action={logout}>
          <Button variant="destructive">Выйти</Button>
        </form>
      </header>
      <div className="p-12 grid grid-cols-3 gap-4">
        {forms.map((form) => {
          return (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-md">{form.name}</CardTitle>
                <Link href={"/forms/" + form.id}>
                  <Button className="flex flex-row items-center gap-2">
                    <Play className="w-[1.2rem] h-[1.2rem]" />
                    Запустить{" "}
                  </Button>
                </Link>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
