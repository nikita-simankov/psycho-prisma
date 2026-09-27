import { Button } from "@/components/ui/button";
import type { Context } from "@/utils/authentication";
import { parseCareReason } from "@/utils/care";
import { localizeTest } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { organizationBase } from "@/utils/organization-path";
import { can } from "@/utils/roles";
import { formatFullName } from "@/utils/user";
import { ruleLabel } from "@/utils/wellbeing-scores";
import { HeartHandshake } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ResolveButton } from "./resolve-button";

// Care follow-ups raised when someone's screening result crossed a personal level. The reason is
// restricted: everything here renders only for roles with viewSensitive.

async function openFlags(context: Context, userId?: string) {
  const flags = await prisma.careFlag.findMany({
    where: { organizationId: context.organization.id, resolvedAt: null, ...(userId && { userId }) },
    include: { user: { select: { id: true, name: true, lastName: true, middleName: true } } },
    orderBy: { createdAt: "asc" },
  });
  const locale = await getLocale();
  const tests = await prisma.test.findMany({ where: { id: { in: flags.map((flag) => flag.testId) } } });
  return flags.map((flag) => {
    const test = tests.find((entry) => entry.id === flag.testId);
    return {
      ...flag,
      testName: test ? localizeTest(test, locale).name : "",
      reasons: parseCareReason(flag.reason).map((reason) => ruleLabel({ ...reason, testId: flag.testId }, tests, locale)),
    };
  });
}

function Reason({ testName, reasons }: { testName: string; reasons: string[] }) {
  return (
    <span>
      {testName}
      {reasons.length > 0 && `: ${reasons.join(", ")}`}
    </span>
  );
}

// The follow-up page's list of everyone waiting for a check-in.
export async function CareFlagList({ context }: { context: Context }) {
  if (!can(context.membership.role, "viewSensitive")) return null;
  const t = await getTranslations("wellbeing.care");
  const format = await getFormatter();
  const base = await organizationBase();
  const flags = await openFlags(context);

  return (
    <section aria-labelledby="care-heading" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id="care-heading" className="text-xl font-medium">
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("text")}</p>
      </div>
      {flags.length === 0 ? (
        <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {flags.map((flag) => (
            <li key={flag.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 flex-col gap-1">
                <Link href={`${base}/people/${flag.userId}`} className="font-medium underline-offset-4 hover:underline">
                  {formatFullName(flag.user)}
                </Link>
                <p className="text-sm text-muted-foreground">
                  <Reason testName={flag.testName} reasons={flag.reasons} />
                  {" · "}
                  {format.dateTime(flag.createdAt, { dateStyle: "medium" })}
                </p>
              </div>
              <ResolveButton kind="care" id={flag.id} label={t("resolve")} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// A person's open follow-ups, beside their profile.
export async function CarePanel({ context, userId }: { context: Context; userId: string }) {
  if (!can(context.membership.role, "viewSensitive")) return null;
  const flags = await openFlags(context, userId);
  if (!flags.length) return null;
  const t = await getTranslations("wellbeing.care");
  const format = await getFormatter();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-l-2 border-l-warning bg-card p-3" data-care-flag>
      <p className="flex items-center gap-2 text-sm font-medium">
        <HeartHandshake className="size-4 text-warning" aria-hidden />
        {t("panelTitle")}
      </p>
      {flags.map((flag) => (
        <div key={flag.id} className="flex flex-col gap-2 text-sm">
          <p className="text-muted-foreground">
            <Reason testName={flag.testName} reasons={flag.reasons} />
            {" · "}
            {format.dateTime(flag.createdAt, { dateStyle: "medium" })}
          </p>
          <ResolveButton kind="care" id={flag.id} label={t("resolve")} />
        </div>
      ))}
    </div>
  );
}

// A line on Today when people are waiting for a check-in.
export async function CareSummary({ context }: { context: Context }) {
  if (!can(context.membership.role, "viewSensitive")) return null;
  const count = await prisma.careFlag.count({ where: { organizationId: context.organization.id, resolvedAt: null } });
  if (!count) return null;
  const t = await getTranslations("wellbeing.care");
  const base = await organizationBase();

  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-warning bg-card py-3 pl-4 pr-3">
      <p className="flex items-center gap-2 text-sm">
        <HeartHandshake className="size-4 shrink-0 text-warning" aria-hidden />
        {t("summary", { count })}
      </p>
      <Button asChild size="sm" variant="outline">
        <Link href={`${base}/people/follow-up`}>{t("open")}</Link>
      </Button>
    </div>
  );
}
