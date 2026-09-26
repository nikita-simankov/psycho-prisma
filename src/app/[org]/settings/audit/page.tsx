import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AUDIT_ACTIONS,
  AUDIT_RETENTION_MONTHS,
  type AuditAction,
} from "@/utils/audit";
import { ensureMember } from "@/utils/authentication";
import { planHasFeature } from "@/utils/billing";
import { UpgradeNotice } from "@/components/billing/upgrade-notice";
import { prisma } from "@/utils/database";
import { organizationBase } from "@/utils/organization-path";
import { formatFullName } from "@/utils/user";
import { isRole } from "@/utils/roles";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { localizeForm, localizeTest } from "@/utils/content-translation";
import Link from "next/link";
import { Pager } from "@/components/pager";
import { pageCount, pageFrom, pageWindow } from "@/utils/pagination";
import { AuditFilters } from "./audit-filters";


export async function generateMetadata() {
  const t = await getTranslations("audit");
  return { title: t("title") };
}

export default async function AuditPage(
  props: {
    searchParams: Promise<Record<string, string | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  const { organization } = await ensureMember("viewAudit");
  if (!(await planHasFeature(organization.id, "audit"))) {
    return <UpgradeNotice feature="audit" />;
  }
  const base = await organizationBase();
  const t = await getTranslations("audit");
  const roles = await getTranslations("roles");
  const format = await getFormatter();
  const page = pageFrom(searchParams.page);
  const action = AUDIT_ACTIONS.find((entry) => entry === searchParams.action);
  const person =
    typeof searchParams.person === "string" ? searchParams.person : undefined;
  const where = {
    organizationId: organization.id,
    ...(action && { action }),
    ...(person && { OR: [{ subjectId: person }, { actorId: person }] }),
  };

  const [events, total, memberships] = await Promise.all([
    prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...pageWindow(page),
    }),
    prisma.auditEvent.count({ where }),
    prisma.membership.findMany({
      where: { organizationId: organization.id },
      select: {
        userId: true,
        user: { select: { name: true, middleName: true, lastName: true } },
      },
    }),
  ]);

  // People who left keep their events; their names are gone with their membership.
  const names = new Map(
    memberships.map((membership) => [
      membership.userId,
      formatFullName(membership.user),
    ]),
  );
  const [tests, forms] = await Promise.all([
    prisma.test.findMany({
      where: {
        id: {
          in: events.flatMap((event) => detailOf(event.detail).testId ?? []),
        },
      },
    }),
    prisma.form.findMany({
      where: {
        id: {
          in: events.flatMap((event) => detailOf(event.detail).formId ?? []),
        },
      },
    }),
  ]);
  const locale = await getLocale();
  const instrument = new Map([
    ...tests.map((test) => [test.id, localizeTest(test, locale).name] as const),
    ...forms.map((form) => [form.id, localizeForm(form, locale).name] as const),
  ]);
  const pages = pageCount(total);


  const personCell = (id: string | null, fallback: string) =>
    id === null ? (
      <span className="text-muted-foreground">{fallback}</span>
    ) : names.has(id) ? (
      <Link
        href={`${base}/people/${id}`}
        className="underline-offset-4 hover:underline"
      >
        {names.get(id)}
      </Link>
    ) : (
      <span className="text-muted-foreground">{t("formerMember")}</span>
    );

  const rows = events.map((event) => {
    const detail = detailOf(event.detail);
    return {
      id: event.id,
      when: format.dateTime(event.createdAt, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      actor: personCell(event.actorId, t("system")),
      subject: personCell(event.subjectId, "—"),
      action: t(`actions.${event.action as AuditAction}`),
      about: [
        detail.testId && instrument.get(detail.testId),
        detail.formId && instrument.get(detail.formId),
        detail.version && t("version", { version: detail.version }),
        detail.role &&
          t("roleChange", {
            role: isRole(detail.role) ? roles(detail.role) : detail.role,
          }),
        detail.deleted && t("deleted", { count: Number(detail.deleted) }),
        detail.kind === "candidate" && t("candidateErased"),
      ]
        .filter(Boolean)
        .join(" · "),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-t border-foreground/80 pt-4">
        <h2 className="text-xl font-medium">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description", { months: AUDIT_RETENTION_MONTHS })}</p>
      </div>
      <AuditFilters
        action={action}
        person={person}
        actions={AUDIT_ACTIONS.map((key) => ({
          key,
          label: t(`actions.${key}`),
        }))}
        people={Array.from(names.entries())
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name))}
      />
      <div className="overflow-hidden rounded-lg border bg-card">
        <div>
          {events.length === 0 ? (
            <p className="p-6 text-muted-foreground">{t("empty")}</p>
          ) : (
            <>
              <ul className="divide-y sm:hidden">
                {rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-col gap-0.5 p-4 text-sm"
                  >
                    <span className="font-medium">{row.action}</span>
                    {row.about && (
                      <span className="text-xs text-muted-foreground">
                        {row.about}
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {row.actor} → {row.subject}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {row.when}
                    </span>
                  </li>
                ))}
              </ul>
              <Table className="hidden sm:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("when")}</TableHead>
                    <TableHead>{t("who")}</TableHead>
                    <TableHead>{t("what")}</TableHead>
                    <TableHead>{t("whose")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-sm tabular-nums">
                        {row.when}
                      </TableCell>
                      <TableCell>{row.actor}</TableCell>
                      <TableCell>
                        <span className="font-medium">{row.action}</span>
                        {row.about && (
                          <span className="block text-xs text-muted-foreground">
                            {row.about}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{row.subject}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </div>
      </div>
      <Pager
        page={page}
        pages={pages}
        path={`${base}/settings/audit`}
        query={{ action, person }}
        labels={{ previous: t("newer"), next: t("older") }}
      />
    </div>
  );
}

function detailOf(value: string): Record<string, string | undefined> {
  try {
    const parsed = JSON.parse(value);
    return Object.fromEntries(
      Object.entries(parsed).map(([key, entry]) => [
        key,
        entry === null ? undefined : String(entry),
      ]),
    );
  } catch {
    return {};
  }
}
