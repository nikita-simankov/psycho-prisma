import { Badge } from "@/components/ui/badge";
import { prisma } from "@/utils/database";
import { cn } from "@/utils/utils";
import { MessageSquareQuote } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

const STATUS_VARIANT = { planned: "outline", inProgress: "secondary", done: "success" } as const;

// "You said, we did", as employees see it: what was done about earlier pulse rounds, for their
// team and for everyone. `exceptRoundId` leaves out the actions of a round (the one about to be taken),
// and `compact` fits it above a pulse round's first question.
export async function YouSaidWeDid({
  organizationId,
  teamId,
  exceptRoundId,
  compact = false,
}: {
  organizationId: string;
  teamId: string | null;
  exceptRoundId?: string;
  compact?: boolean;
}) {
  const actions = await prisma.teamAction.findMany({
    where: {
      organizationId,
      OR: [{ teamId: null }, ...(teamId ? [{ teamId }] : [])],
      ...(exceptRoundId && { NOT: { roundId: exceptRoundId } }),
    },
    include: { round: { select: { name: true } }, team: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
    take: compact ? 5 : 10,
  });
  if (!actions.length) return null;

  const t = await getTranslations("wellbeing.actions");
  const format = await getFormatter();

  return (
    <section
      aria-labelledby="you-said-heading"
      className={cn("flex flex-col gap-3", compact ? "rounded-lg border bg-card p-4" : "border-t border-foreground/80 pt-4")}
    >
      <div className="flex flex-col gap-1">
        <h2 id="you-said-heading" className={cn("flex items-center gap-2 font-medium", compact ? "font-sans text-sm" : "text-xl")}>
          <MessageSquareQuote className="size-4 shrink-0 text-primary" aria-hidden />
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{compact ? t("beforeText") : t("respondentText")}</p>
      </div>
      <ul className={cn("flex flex-col", compact ? "gap-2" : "divide-y rounded-lg border bg-card")}>
        {actions.map((action) => (
          <li key={action.id} className={cn("flex items-start justify-between gap-3 text-sm", !compact && "p-4")}>
            <span className="min-w-0">
              <span className="block">{action.text}</span>
              {!compact && (
                <span className="text-xs text-muted-foreground">
                  {[action.team?.name ?? t("everyone"), action.round?.name, format.dateTime(action.updatedAt, { dateStyle: "medium" })].filter(Boolean).join(" · ")}
                </span>
              )}
            </span>
            <Badge variant={STATUS_VARIANT[action.status as keyof typeof STATUS_VARIANT] ?? "outline"} className="shrink-0">
              {t(`statuses.${action.status as "planned"}`)}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
