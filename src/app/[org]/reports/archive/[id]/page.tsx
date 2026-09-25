import { findArchiveEntryByUserId } from "@/actions/summary/find-archive-entries";
import { findUserById } from "@/actions/user/find-user-by-id-action";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFullName, formatWorkInfo } from "@/utils/user";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { organizationBase } from "@/utils/organization-path";

interface Params {
  params: {
    id: string;
  };
}

export default async function ArchiveEntryPage({ params }: Params) {
  const base = organizationBase();
  const t = await getTranslations("archive");
  const reports = await getTranslations("reports");
  const [user, entry] = await Promise.all([
    findUserById(params.id),
    findArchiveEntryByUserId(params.id),
  ]);

  if (!user || !entry) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={formatFullName(user)}
        description={formatWorkInfo(user)}
        back={{ href: `${base}/reports/archive`, label: t("title") }}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`${base}/people/${user.id}`}>{t("viewProfile")}</Link>
            </Button>
            <Button asChild>
              <Link href={`${base}/reports/${user.id}`}>{t("viewReport")}</Link>
            </Button>
          </>
        }
      />
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{reports("background")}</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-line">{entry.additionalNotes || "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{reports("conclusion")}</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-line">{entry.verdict || "—"}</CardContent>
        </Card>
      </div>
    </>
  );
}
