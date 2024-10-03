import { logout } from "@/actions/auth/logout.action";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pyramid } from "lucide-react";
import Link from "next/link";

export default async function Page() {
  const tests = await findAllTests();

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
      <div className="p-12 grid grid-cols-2 gap-4">
        {tests.map((test) => {
          return (
            <Card className="p-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-md max-w-[400px]">
                  {test.name}
                </CardTitle>
                <Link href={"/tests/" + test.id}>
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
