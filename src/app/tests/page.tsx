import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, Pyramid } from "lucide-react";
import { Category, Test } from "@prisma/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logout } from "@/actions/auth/logout.action";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { Separator } from "@/components/ui/separator";

function categorizeTests(tests: (Test & { categories: Category[] })[]) {
  const categories = new Map<string, (Test & { categories: Category[] })[]>();

  tests.forEach((test) => {
    for (const category of test.categories) {
      if (!categories.has(category.name)) {
        categories.set(category.name, [test]);
      } else {
        categories.set(category.name, [
          ...categories.get(category.name)!,
          test,
        ]);
      }
    }
  });

  return categories;
}

export default async function Page() {
  const tests = await findAllTests();

  const categorizedTests = categorizeTests(tests);
  const categories = Array.from(categorizedTests.keys());

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
        {/* @ts-ignore */}
        <form action={logout}>
          <Button variant="destructive">Выйти</Button>
        </form>
      </header>
      <div className="flex flex-col gap-4 items-center p-6">
        <h1 className="text-2xl font-bold">Тестирование</h1>
        <Separator />
        <Tabs defaultValue={categories[0]}>
          <TabsList>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map((category) => {
            return (
              <TabsContent
                key={category}
                value={category}
                className="flex flex-col gap-3"
              >
                {categorizedTests.get(category)!.map((test) => (
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
                ))}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
