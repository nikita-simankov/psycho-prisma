import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { describeItems, itemKey, parseItems, submittedItems } from "@/utils/rounds";
import { feedbackTestIds } from "@/utils/feedback";
import { localizeTest } from "@/utils/content-translation";
import { cn } from "@/utils/utils";
import { BarChart3, CheckCircle2, ChevronRight, CircleCheck, Circle, Clock, ListChecks } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

export async function generateMetadata() {
  const t = await getTranslations("assessments");
  return { title: t("title") };
}

// The respondent's home: what was sent to them and what they have finished.
export default async function AssessmentsPage({ searchParams }: { searchParams: { done?: string } }) {
  const { user, organization } = await ensureMember();
  const t = await getTranslations("assessments");
  const respondent = await getTranslations("respondent");
  const common = await getTranslations("common");
  const format = await getFormatter();
  const locale = await getLocale();

  const assignments = await prisma.assignment.findMany({
    where: { userId: user.id, round: { organizationId: organization.id } },
    include: { round: true },
    orderBy: { createdAt: "desc" },
  });

  const done = await submittedItems(assignments.map((assignment) => assignment.id));
  const info = await describeItems(
    assignments.flatMap((assignment) => parseItems(assignment.items)),
    locale
  );

  const open = assignments
    .filter((assignment) => !assignment.completedAt && !assignment.round.closedAt)
    // Soonest due first; rounds without a due date last.
    .sort((a, b) => (a.round.dueAt?.getTime() ?? Infinity) - (b.round.dueAt?.getTime() ?? Infinity));
  const finished = assignments.filter((assignment) => assignment.completedAt);

  // Results the organization shares back with the person, latest per test.
  const shared = await feedbackTestIds(organization.id);
  const ownResults = shared.size
    ? await prisma.testSubmission.findMany({
        where: { userId: user.id, organizationId: organization.id, testId: { in: Array.from(shared) } },
        orderBy: { createdAt: "desc" },
        select: { id: true, testId: true, createdAt: true },
      })
    : [];
  const latestResults = ownResults.filter((result, index) => ownResults.findIndex((other) => other.testId === result.testId) === index);
  const resultTests = await prisma.test.findMany({
    where: { id: { in: latestResults.map((result) => result.testId) } },
  });
  const resultName = (testId: string) => {
    const test = resultTests.find((entry) => entry.id === testId);
    return test ? localizeTest(test, locale).name : "";
  };
  const now = new Date();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-10">
      {searchParams.done === "1" && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="font-medium">{respondent("savedTitle")}</p>
            <p className="text-sm text-muted-foreground">{open.length ? t("savedMore") : t("savedAll")}</p>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{respondent("greeting", { name: user.name })}</p>
        <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
        <p className="max-w-2xl text-muted-foreground">{t("intro", { organization: organization.name })}</p>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="todo-heading">
        <h2 id="todo-heading" className="text-lg font-semibold">
          {t("todo")}
        </h2>
        {open.length === 0 && (
          <Card>
            <EmptyState icon={ListChecks} title={t("nothingToDo")} description={t("nothingToDoText")} />
          </Card>
        )}
        {open.map((assignment) => {
          const items = parseItems(assignment.items);
          const finishedKeys = done.get(assignment.id) ?? new Set<string>();
          const next = items.find((item) => !finishedKeys.has(itemKey(item)));
          const overdue = assignment.round.dueAt && assignment.round.dueAt < now;
          const href = (item: (typeof items)[number]) =>
            `/${item.kind === "test" ? "tests" : "forms"}/${item.id}?assignment=${assignment.id}`;

          return (
            <Card key={assignment.id}>
              <CardHeader className="gap-1 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{assignment.round.name}</CardTitle>
                  {assignment.round.dueAt && (
                    <Badge variant={overdue ? "destructive" : "secondary"} className="gap-1">
                      <Clock className="h-3 w-3" />
                      {t(overdue ? "overdue" : "due", {
                        date: format.dateTime(assignment.round.dueAt, { dateStyle: "medium" }),
                      })}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {t("progress", { done: finishedKeys.size, total: items.length })}
                </CardDescription>
                {assignment.round.message && (
                  <p className="whitespace-pre-line rounded-lg bg-muted p-3 text-sm">{assignment.round.message}</p>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <ul className="divide-y rounded-lg border">
                  {items.map((item) => {
                    const key = itemKey(item);
                    const complete = finishedKeys.has(key);
                    const details = info.get(key);
                    const content = (
                      <>
                        {complete ? (
                          <CircleCheck className="h-5 w-5 shrink-0 text-success" aria-label={t("finished")} />
                        ) : (
                          <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className={cn("block font-medium leading-snug", complete && "text-muted-foreground")}>
                            {details?.name ?? t("unavailable")}
                          </span>
                          {details && (
                            <span className="text-sm text-muted-foreground">
                              {respondent("questionCount", { count: details.questionCount })} ·{" "}
                              {common("minutes", { count: details.minutes })}
                            </span>
                          )}
                        </span>
                        {!complete && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      </>
                    );

                    return (
                      <li key={key}>
                        {complete ? (
                          <div className="flex items-center gap-3 p-3">{content}</div>
                        ) : (
                          <Link href={href(item)} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                            {content}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {next && (
                  <Button asChild className="w-full sm:w-fit">
                    <Link href={href(next)}>{finishedKeys.size ? t("continue") : t("start")}</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      {finished.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="done-heading">
          <h2 id="done-heading" className="text-lg font-semibold">
            {t("done")}
          </h2>
          <Card>
            <ul className="divide-y">
              {finished.map((assignment) => (
                <li key={assignment.id} className="flex items-center gap-3 p-4">
                  <CircleCheck className="h-5 w-5 shrink-0 text-success" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{assignment.round.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {t("finishedOn", { date: format.dateTime(assignment.completedAt!, { dateStyle: "medium" }) })}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {latestResults.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="results-heading">
          <h2 id="results-heading" className="text-lg font-semibold">
            {t("yourResults")}
          </h2>
          <Card>
            <ul className="divide-y">
              {latestResults.map((result) => (
                <li key={result.id}>
                  <Link href={`/assessments/results/${result.id}`} className="flex items-center gap-3 p-4 hover:bg-muted/50">
                    <BarChart3 className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{resultName(result.testId)}</span>
                      <span className="text-sm text-muted-foreground">
                        {format.dateTime(result.createdAt, { dateStyle: "medium" })}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <p className="text-sm text-muted-foreground">{respondent("privacyNote")}</p>
    </div>
  );
}
