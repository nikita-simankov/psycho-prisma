import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/utils/database";
import Link from "next/link";
import DeleteEntryButton from "./delete-button";

export default async function ArchivePage() {
  const archiveEntries = await prisma.userSummary.findMany({
    include: {
      user: true,
    },
  });

  return (
    <div className="p-12 flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Архив характеристик военнослужащих</h1>
      <Separator />
      {archiveEntries.length > 0 ? (
        <div className="grid grid-cols-4 gap-4">
          {archiveEntries.map((entry) => (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {entry.user?.lastName} {entry.user?.name}{" "}
                  {entry.user?.surname}
                </CardTitle>
                <CardDescription>
                  {entry.user?.rank}, {entry.user?.division}
                </CardDescription>
              </CardHeader>
              <CardFooter className="w-full flex flex-row items-center gap-4">
                <DeleteEntryButton summaryId={entry.id} />
                <Button size="sm" className="w-1/2" asChild>
                  <Link href={"/dashboard/archive/" + entry.user?.id}>
                    Заключение
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <h1 className="text-lg font-medium text-muted-foreground">
            Архив пуст
          </h1>
        </div>
      )}
    </div>
  );
}
