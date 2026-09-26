import { Badge } from "@/components/ui/badge";
import { prisma } from "@/utils/database";
import type { InstrumentKind } from "@/utils/instrument-content";
import { formatFullName } from "@/utils/user";
import { getFormatter, getTranslations } from "next-intl/server";
import { RestoreVersionButton } from "./studio-buttons";

// Every published version, newest first, with how many results were given on each.
export async function VersionHistory({
  kind,
  instrument,
}: {
  kind: InstrumentKind;
  instrument: { id: string; version: number; createdAt: Date; organizationId: string };
}) {
  const t = await getTranslations("studio.versions");
  const format = await getFormatter();

  const [snapshots, counts] = await Promise.all([
    prisma.instrumentVersion.findMany({
      where: { kind, instrumentId: instrument.id },
      select: { version: true, note: true, createdAt: true, createdById: true },
      orderBy: { version: "desc" },
    }),
    kind === "test"
      ? prisma.testSubmission
          .groupBy({ by: ["testVersion"], where: { testId: instrument.id, organizationId: instrument.organizationId }, _count: true })
          .then((rows) => new Map(rows.map((row) => [row.testVersion, row._count])))
      : prisma.formSubmission
          .groupBy({ by: ["formVersion"], where: { formId: instrument.id, organizationId: instrument.organizationId }, _count: true })
          .then((rows) => new Map(rows.map((row) => [row.formVersion, row._count]))),
  ]);

  const authorIds = snapshots.flatMap((snapshot) => (snapshot.createdById ? [snapshot.createdById] : []));
  const authors = new Map(
    (await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true, lastName: true, middleName: true } })).map((user) => [
      user.id,
      formatFullName(user),
    ])
  );

  // Published before the studio kept snapshots: only the current version is known, as first created.
  const versions =
    snapshots.length > 0
      ? snapshots
      : instrument.version > 0
        ? [{ version: instrument.version, note: "", createdAt: instrument.createdAt, createdById: null }]
        : [];

  if (versions.length === 0) {
    return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t("none")}</p>;
  }

  return (
    <ol className="divide-y rounded-lg border bg-card">
      {versions.map((entry) => (
        <li key={entry.version} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{t("version", { version: entry.version })}</span>
              {entry.version === instrument.version && <Badge variant="secondary">{t("current")}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {format.dateTime(entry.createdAt, { dateStyle: "medium", timeStyle: "short" })}
              {entry.createdById && authors.get(entry.createdById) ? ` · ${authors.get(entry.createdById)}` : ""}
              {" · "}
              {t("results", { count: counts.get(entry.version) ?? 0 })}
            </p>
            {entry.note && <p className="whitespace-pre-line text-sm">{entry.note}</p>}
          </div>
          {entry.version !== instrument.version && <RestoreVersionButton kind={kind} id={instrument.id} version={entry.version} />}
        </li>
      ))}
    </ol>
  );
}
