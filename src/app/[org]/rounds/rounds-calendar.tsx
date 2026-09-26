"use client";

import { moveRoundDue } from "@/actions/round/round-actions";
import { useOrganizationBase } from "@/components/organization-provider";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { RoundHealth } from "@/utils/round-health";
import { cn } from "@/utils/utils";
import { ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

export type CalendarRound = { id: string; name: string; due: string; health: RoundHealth };
export type CalendarSchedule = { id: string; name: string; next: string };

const DOT: Record<RoundHealth, string> = {
  done: "border-l-success",
  onTrack: "border-l-primary",
  atRisk: "border-l-warning",
  overdue: "border-l-destructive",
};

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// A month of due dates and upcoming automatic rounds. Drag an open round to another day to move
// its due date.
export function RoundsCalendar({ rounds, schedules }: { rounds: CalendarRound[]; schedules: CalendarSchedule[] }) {
  const t = useTranslations("rounds.calendar");
  const format = useFormatter();
  const base = useOrganizationBase();
  const router = useRouter();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const today = dayKey(new Date());

  // Six weeks starting on Monday, so every month fits.
  const days = useMemo(() => {
    const first = new Date(month);
    const offset = (first.getDay() + 6) % 7;
    first.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, index) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + index));
  }, [month]);
  const weekdays = days.slice(0, 7).map((day) => format.dateTime(day, { weekday: "short" }));

  const move = (roundId: string, day: string) => {
    const round = rounds.find((entry) => entry.id === roundId);
    if (!round || round.due === day) return;
    if (day < today) {
      toast({ title: t("past"), variant: "destructive" });
      return;
    }
    startTransition(async () => {
      const result = await moveRoundDue(roundId, day);
      if ("error" in result) {
        toast({ title: t("past"), variant: "destructive" });
        return;
      }
      toast({ title: t("moved", { name: round.name, date: format.dateTime(new Date(`${day}T12:00:00`), { dateStyle: "medium" }) }) });
      router.refresh();
    });
  };

  return (
    <div className={cn("flex flex-col gap-3", pending && "opacity-70")}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading text-xl capitalize">{format.dateTime(month, { month: "long", year: "numeric" })}</h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" aria-label={t("previous")} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
            {t("today")}
          </Button>
          <Button variant="outline" size="icon" aria-label={t("next")} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[42rem] grid-cols-7 border-l border-t text-sm">
          {weekdays.map((weekday) => (
            <div key={weekday} className="border-b border-r bg-card px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {weekday}
            </div>
          ))}
          {days.map((day) => {
            const key = dayKey(day);
            const inMonth = day.getMonth() === month.getMonth();
            const due = rounds.filter((round) => round.due === key);
            const runs = schedules.filter((schedule) => schedule.next === key);
            return (
              <div
                key={key}
                data-day={key}
                onDragOver={(event) => {
                  if (!dragging) return;
                  event.preventDefault();
                  setOver(key);
                }}
                onDragLeave={() => setOver((current) => (current === key ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  const id = event.dataTransfer.getData("text/round") || dragging;
                  setOver(null);
                  setDragging(null);
                  if (id) move(id, key);
                }}
                className={cn(
                  "flex min-h-24 flex-col gap-1 border-b border-r p-1.5",
                  !inMonth && "bg-muted/40 text-muted-foreground",
                  over === key && "bg-primary/10 ring-2 ring-inset ring-primary"
                )}
              >
                <span className={cn("w-fit rounded px-1 font-mono text-xs", key === today && "bg-primary text-primary-foreground")}>
                  {day.getDate()}
                </span>
                {due.map((round) => (
                  <Link
                    key={round.id}
                    href={`${base}/rounds/${round.id}`}
                    draggable={round.health !== "done"}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/round", round.id);
                      event.dataTransfer.effectAllowed = "move";
                      setDragging(round.id);
                    }}
                    onDragEnd={() => setDragging(null)}
                    title={t("dragHint")}
                    className={cn(
                      "truncate rounded border border-l-4 bg-background px-1.5 py-0.5 text-xs hover:bg-muted",
                      DOT[round.health],
                      round.health !== "done" && "cursor-grab active:cursor-grabbing"
                    )}
                  >
                    {round.name}
                  </Link>
                ))}
                {runs.map((schedule) => (
                  <span key={schedule.id} className="flex items-center gap-1 truncate rounded border border-dashed px-1.5 py-0.5 text-xs text-muted-foreground">
                    <Repeat className="size-3 shrink-0" aria-hidden />
                    {schedule.name}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
