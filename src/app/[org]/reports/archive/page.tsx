import { findAllArchiveEntries } from "@/actions/summary/find-archive-entries";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import UserAvatar from "@/components/ui/user-avatar";
import { ensureMember } from "@/utils/authentication";
import { can } from "@/utils/roles";
import { formatFullName, formatWorkInfo } from "@/utils/user";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import DeleteEntryButton from "./delete-button";
import { organizationBase } from "@/utils/organization-path";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("archive") };
}

export default async function ArchivePage() {
  const base = organizationBase();
  const t = await getTranslations("archive");
  const entries = await findAllArchiveEntries();
  const { membership } = await ensureMember("viewDashboard");
  const write = can(membership.role, "writeConclusions");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      {entries.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">{t("empty")}</Card>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) =>
          entry.user ? (
            <Card key={entry.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <UserAvatar user={entry.user} className="h-10 w-10" />
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">{formatFullName(entry.user)}</CardTitle>
                  <CardDescription className="truncate">{formatWorkInfo(entry.user)}</CardDescription>
                </div>
              </CardHeader>
              <CardFooter className={write ? "mt-auto grid grid-cols-2 gap-2" : "mt-auto grid gap-2"}>
                {write && <DeleteEntryButton summaryId={entry.id} />}
                <Button asChild>
                  <Link href={`${base}/reports/archive/${entry.user.id}`}>{t("open")}</Link>
                </Button>
              </CardFooter>
            </Card>
          ) : null
        )}
      </div>
    </>
  );
}
