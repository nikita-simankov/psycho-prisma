import { findAllArchiveEntries } from "@/actions/summary/find-archive-entries";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatFullName, formatWorkInfo } from "@/utils/user";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import DeleteEntryButton from "./delete-button";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("archive") };
}

export default async function ArchivePage() {
  const t = await getTranslations("archive");
  const entries = await findAllArchiveEntries();

  return (
    <div className="p-12 flex flex-col gap-4">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <Separator />
      {entries.length === 0 && (
        <p className="text-lg font-medium text-muted-foreground">{t("empty")}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {entries.map((entry) =>
          entry.user ? (
            <Card key={entry.id}>
              <CardHeader>
                <CardTitle className="text-lg">{formatFullName(entry.user)}</CardTitle>
                <CardDescription>{formatWorkInfo(entry.user)}</CardDescription>
              </CardHeader>
              <CardFooter className="w-full flex flex-row items-center gap-4">
                <DeleteEntryButton summaryId={entry.id} />
                <Button size="sm" className="w-1/2" asChild>
                  <Link href={`/dashboard/archive/${entry.user.id}`}>{t("open")}</Link>
                </Button>
              </CardFooter>
            </Card>
          ) : null
        )}
      </div>
    </div>
  );
}
