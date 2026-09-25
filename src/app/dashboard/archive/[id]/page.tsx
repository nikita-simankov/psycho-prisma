import { findArchiveEntryByUserId } from "@/actions/summary/find-archive-entries";
import { findUserById } from "@/actions/user/find-user-by-id-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import UserAvatar from "@/components/ui/user-avatar";
import { formatFullName, formatWorkInfo } from "@/utils/user";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Params {
  params: {
    id: string;
  };
}

export default async function ArchiveEntryPage({ params }: Params) {
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
    <div className="p-12 max-w-6xl w-full mx-auto flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-4">
            <UserAvatar user={user} className="w-20 h-20" />
            <div className="flex flex-col gap-2">
              <CardTitle>{formatFullName(user)}</CardTitle>
              <CardDescription>{formatWorkInfo(user)}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" asChild>
              <Link href={`/dashboard/summary/${user.id}`}>{t("viewReport")}</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/users/${user.id}`}>{t("viewProfile")}</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{reports("background")}</CardTitle>
        </CardHeader>
        <CardContent className="whitespace-pre-line">{entry.additionalNotes}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{reports("conclusion")}</CardTitle>
        </CardHeader>
        <CardContent className="whitespace-pre-line">{entry.verdict}</CardContent>
      </Card>
    </div>
  );
}
