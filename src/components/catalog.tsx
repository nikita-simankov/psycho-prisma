import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Category } from "@prisma/client";
import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

type CatalogItem = { id: string; name: string; categories: Category[] };

// Items grouped into tabs by category; an item can appear under several categories.
export function Catalog({
  items,
  hrefPrefix,
}: {
  items: CatalogItem[];
  hrefPrefix: string;
}) {
  const t = useTranslations("respondent");
  const byCategory = new Map<string, CatalogItem[]>();

  for (const item of items) {
    for (const category of item.categories) {
      byCategory.set(category.name, [...(byCategory.get(category.name) ?? []), item]);
    }
  }

  const categories = Array.from(byCategory.keys());

  if (categories.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <Tabs defaultValue={categories[0]} className="w-full max-w-3xl">
      <TabsList className="flex-wrap h-auto">
        {categories.map((category) => (
          <TabsTrigger key={category} value={category}>
            {category}
          </TabsTrigger>
        ))}
      </TabsList>
      {categories.map((category) => (
        <TabsContent key={category} value={category} className="flex flex-col gap-3">
          {byCategory.get(category)!.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-base">{item.name}</CardTitle>
                <Button asChild className="flex flex-row items-center gap-2 shrink-0">
                  <Link href={hrefPrefix + item.id}>
                    <Play className="w-[1.2rem] h-[1.2rem]" />
                    {t("open")}
                  </Link>
                </Button>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>
      ))}
    </Tabs>
  );
}
