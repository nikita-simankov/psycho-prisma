import Link from "next/link";
import Logo from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { logout } from "@/actions/auth/logout.action";
import { findAllForms } from "@/actions/form/find-all-forms-action";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Category, Form } from "@prisma/client";
import { Play, Pyramid } from "lucide-react";

function categorizeForms(forms: (Form & { categories: Category[] })[]) {
  const categories = new Map<string, (Form & { categories: Category[] })[]>();

  forms.forEach((form) => {
    for (const category of form.categories) {
      if (!categories.has(category.name)) {
        categories.set(category.name, [form]);
      } else {
        categories.set(category.name, [
          ...categories.get(category.name)!,
          form,
        ]);
      }
    }
  });

  return categories;
}

export default async function Page() {
  const forms = await findAllForms();
  const categorizedForms = categorizeForms(
    forms.filter((form) => form.adminOnly === false)
  );
  const categories = Array.from(categorizedForms.keys());

  return (
    <div>
      <header className="w-full h-16 px-6 py-2 border-b flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-2">
          <Logo withText />
          <nav className="ml-6 flex flex-row items-center gap-4">
            <Link
              href="/forms"
              className="text-sm text-muted-foreground font-medium hover:text-black dark:hover:text-white transition-colors duration-300"
            >
              Анкетирование
            </Link>
            <Link
              href="/tests"
              className="text-sm text-muted-foreground font-medium hover:text-black dark:hover:text-white transition-colors duration-300"
            >
              Тестовые методики
            </Link>
          </nav>
        </div>
        {/* @ts-ignore */}
        <form action={logout}>
          <Button variant="destructive">Выйти</Button>
        </form>
      </header>
      <div className="flex flex-col gap-4 items-center p-6">
        <h1 className="text-2xl font-bold">Анкетирование</h1>
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
                {categorizedForms.get(category)!.map((form) => (
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
                ))}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
